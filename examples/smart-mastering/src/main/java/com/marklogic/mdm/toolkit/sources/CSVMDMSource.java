package com.marklogic.mdm.toolkit.sources;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.LineCallbackHandler;
import org.springframework.batch.item.file.mapping.DefaultLineMapper;
import org.springframework.batch.item.file.mapping.FieldSetMapper;
import org.springframework.batch.item.file.transform.DelimitedLineTokenizer;
import org.springframework.batch.item.file.transform.FieldSet;
import org.springframework.core.io.FileSystemResource;
import org.springframework.validation.BindException;

import com.marklogic.client.io.Format;

@EnableBatchProcessing
public class CSVMDMSource extends MDMSource {

  @Override
  public ItemReader<? extends Map<String, Object>> sourceReader() {
    FlatFileItemReader<Map<String, Object>> reader = new FlatFileItemReader<Map<String, Object>>();
    DelimitedLineTokenizer tokenizer = new DelimitedLineTokenizer();
    reader.setLinesToSkip(1);
    reader.setSkippedLinesCallback(new LineCallbackHandler() {
      @Override
      public void handleLine(String line) {
        tokenizer.setNames(tokenizer.tokenize(line).getValues());
      }
    });
    Path csvPath = Paths.get(this.configuration.path("inputFile").asText()).toAbsolutePath();
    FileSystemResource csvFile = new FileSystemResource(csvPath.toString());
        reader.setResource(csvFile);
        reader.setLineMapper(new DefaultLineMapper<Map<String, Object>>() {{
            setLineTokenizer(tokenizer);
            setFieldSetMapper(new FieldSetMapper<Map<String, Object>>() {

              @Override
              public Map<String, Object> mapFieldSet(FieldSet fieldSet) throws BindException {
                Map<String, Object> map = new HashMap<String, Object>();
                Properties props = fieldSet.getProperties();
                for (Object propertyName: props.keySet()) {
                  map.put(propertyName.toString(), fieldSet.readString(propertyName.toString()));
                }
                return map;
              }
            });

        }});
        return reader;
  }

  @Override
  public Format sourceFormat() {
    return Format.XML;
  }

  @Override
  public String convertMapItemToDocument(Map<String, Object> item) {
    String rootName = dataRootName.toLowerCase().replaceFirst("^[0-9]+\\-", "");
    StringBuilder sb = new StringBuilder();
    sb.append("<").append(rootName).append(">");
    for (String key : item.keySet()) {
      sb.append("<").append(key).append(">");
      Object value = item.get(key);
      if (value != null) {
        sb.append(StringEscapeUtils.escapeXml10(value.toString()));
      }
      sb.append("</").append(key).append(">");
    }
    sb.append("</").append(rootName).append(">");
    return sb.toString();
  }


}
