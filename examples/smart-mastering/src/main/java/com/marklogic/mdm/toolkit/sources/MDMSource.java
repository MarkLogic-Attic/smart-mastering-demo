package com.marklogic.mdm.toolkit.sources;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.JobScope;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.datamovement.DataMovementManager;
import com.marklogic.client.datamovement.JobTicket;
import com.marklogic.client.datamovement.WriteBatcher;
import com.marklogic.client.document.DocumentWriteOperation;
import com.marklogic.client.document.DocumentWriteSet;
import com.marklogic.client.document.GenericDocumentManager;
import com.marklogic.client.document.ServerTransform;
import com.marklogic.client.ext.helper.LoggingObject;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.hub.HubConfig;
import com.marklogic.hub.HubConfigBuilder;

import joptsimple.OptionParser;

@EnableBatchProcessing
public abstract class MDMSource  extends LoggingObject implements EnvironmentAware {

  protected Environment env;

  private final String JOB_NAME = "MDMImport";

  protected String importID = null;


  public void configureOptionParser(OptionParser parser) {
    parser.accepts("configuration", "Path to configuration JSON").withRequiredArg();
    parser.accepts("project_dir", "Data Hub project directory").withRequiredArg();
    parser.accepts("env", "Environment to use in Data Hub project directory").withRequiredArg();
    parser.allowsUnrecognizedOptions();
  }

  @Bean
  public Job job(JobBuilderFactory jobBuilderFactory, Step step) {
    return jobBuilderFactory.get(JOB_NAME).start(step).build();
  }

  protected String primaryKey = null;
  protected String sourceName = "";
  protected String dataRootName = "root";
  protected String collections = "";
  protected JsonNode configuration = null;

  public String getCollections() {
    return collections;
  }

  public void setCollections(String collections) {
    this.collections = collections;
  }

  public String getSourceName() {
    return sourceName;
  }

  public void setSourceName(String sourceName) {
    this.sourceName = sourceName;
  }

  public abstract ItemReader<? extends Map<String, Object>> sourceReader();

  public abstract Format sourceFormat();

  public abstract String convertMapItemToDocument(Map<String, Object> item);

  @Bean
  @JobScope
  public Step step(
      StepBuilderFactory stepBuilderFactory,
      @Value("#{jobParameters['env']}") final String environment,
      @Value("#{jobParameters['project_dir']}") final String projectDir,
      @Value("#{jobParameters['configuration']}") final String configurationPath
           ) {
    HubConfig dataHubConfig = HubConfigBuilder.newHubConfigBuilder(projectDir)
        .withPropertiesFromEnvironment(environment)
        .build();
    DatabaseClient dbClient = dataHubConfig.newStagingClient();
    importID = "mdm-import-" + UUID.randomUUID();
    if (configurationPath != null && !configurationPath.equals("")) {
      logger.info("Reading configuration file at {}.", configurationPath);
      Path absoluteConfigurationPath = Paths.get(configurationPath).toAbsolutePath();
      byte[] configurationBytes = null;
      try {
        configurationBytes = Files.readAllBytes(absoluteConfigurationPath);
      } catch (IOException e) {
        logger.error("Error reading configuration document", e);
      }
      ObjectMapper objectMapper = new ObjectMapper();
      try {
        this.configuration = objectMapper.readTree(configurationBytes);
      } catch (JsonProcessingException e) {
        logger.error("Error processing configuration JSON", e);
      } catch (IOException e) {
        logger.error("IO Error reading configuration JSON", e);
      }
      if (!configuration.path("dataRootName").isMissingNode()) {
        this.dataRootName = configuration.path("dataRootName").asText();
      }
      if (!configuration.path("primaryKey").isMissingNode()) {
        this.primaryKey = configuration.path("primaryKey").asText();
      }
      if (!configuration.path("sourceName").isMissingNode()) {
        this.sourceName = configuration.path("sourceName").asText();
      }
      if (!configuration.path("collections").isMissingNode()) {
        this.collections = configuration.path("collections").asText();
      }
      String prefix = "";
      if (!collections.equals("")) {
        prefix = ",";
      }
      this.collections = this.collections + prefix + "mdm-source://" + this.sourceName + ",mdm-content,mdm-import://"+importID;
    }
    String modelMappingUri = "/mdm-import/" + importID + ".json";
    StringHandle handle = new StringHandle();
    StringBuilder sb = new StringBuilder();
    handle.set(
      sb
        .append("{ \"importID\": \"")
        .append(importID)
        .append("\", \"modelMapping\": ")
        .append(configuration.path("modelMapping").toString())
        .append("}")
        .toString()
    );
    handle.setFormat(Format.JSON);

    DocumentMetadataHandle metadata = new DocumentMetadataHandle();
    metadata.withCollections(
      "mdm-import://" + importID,
      "mdm-model-mapper"
    );

    GenericDocumentManager docMgr = dbClient.newDocumentManager();
    DocumentWriteSet batch = docMgr.newWriteSet();
    batch.add(new MarkLogicWriteHandle(modelMappingUri, metadata, handle));
    docMgr.write(batch);

    DataMovementManager dataMovement = dbClient.newDataMovementManager();
    WriteBatcher writeBatcher = dataMovement.newWriteBatcher()
        .withBatchSize(25)
        .withThreadCount(4);
    ServerTransform runFlow = new ServerTransform("run-flow");
    runFlow
      .addParameter("entity-name", "MDM")
      .addParameter("flow-name", "MDMImport")
      .addParameter("options",
          new StringBuilder("{\"mdm-source\":\"")
          .append(MDMSource.this.sourceName)
          .append("\",\"import-id\": \"")
          .append(MDMSource.this.importID)
          .append("\",\"source-format\": \"")
          .append(MDMSource.this.sourceFormat().toString().toLowerCase())
          .append("\"}")
          .toString()
        )
      .addParameter("job-id", MDMSource.this.importID);
    writeBatcher.withTransform(runFlow);
    JobTicket ticket = dataMovement.startJob(writeBatcher);

    ItemProcessor<Map<String, Object>, DocumentWriteOperation> processor = new ItemProcessor<Map<String, Object>, DocumentWriteOperation>() {
      private boolean isFirstCall = true;
      @Override
      public DocumentWriteOperation process(Map<String, Object> item) {
        try {
          if (isFirstCall) {
            StringBuilder logInfoSB = new StringBuilder("Fields: [");
            for (String key:item.keySet()) {
              logInfoSB.append(key).append(",");
            }
            logInfoSB.append("]");
            logger.info(logInfoSB.toString());
            isFirstCall = false;
          }
          String uri = MDMSource.this.generateDocumentURI(item);
          StringHandle handle = new StringHandle();
          handle.set(MDMSource.this.convertMapItemToDocument(item));
          handle.setFormat(MDMSource.this.sourceFormat());

          DocumentMetadataHandle metadata = new DocumentMetadataHandle();
          metadata.withCollections(MDMSource.this.collections.split(","));
          return new MarkLogicWriteHandle(uri, metadata, handle);
        } catch (Exception e) {
          logger.error("Error processing document", e);
          return null;
        }
      }
    };

    ItemWriter<DocumentWriteOperation> writer = new ItemWriter<DocumentWriteOperation>() {
      @Override
      public void write(List<? extends DocumentWriteOperation> items) {
        try {
          for (DocumentWriteOperation item : items) {
            String uri = item.getUri();
            writeBatcher.add(uri, item.getMetadata(), item.getContent());
          }
        } catch (Exception e) {
          e.printStackTrace();
          throw e;
        }
      }
    };

    return stepBuilderFactory.get("step1").<Map<String, Object>, DocumentWriteOperation>chunk(25)
        .reader(MDMSource.this.sourceReader()).processor(processor).writer(writer)
        .listener(new StepExecutionListener() {
          @Override
          public void beforeStep(StepExecution stepExecution) {
          }

          @Override
          public ExitStatus afterStep(StepExecution stepExecution) {
            writeBatcher.flushAndWait();
            dataMovement.stopJob(ticket);
            dataMovement.release();
            return stepExecution.getExitStatus();
          }

        })
        .build();
  }

  protected String generateDocumentURI(Map<String, Object> item) {
    return "/" + sourceName + "/" + dataRootName + "/" + item.get(primaryKey).toString() + ((sourceFormat() == Format.XML) ? ".xml": ".json");
  }

  public String getDataRootName() {
    return dataRootName;
  }

  public void setDataRootName(String dataRootName) {
    this.dataRootName = dataRootName;
  }

  @Override
  public void setEnvironment(Environment environment) {
    this.env = environment;
  }

}
