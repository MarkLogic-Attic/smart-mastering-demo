package com.marklogic.mdm.toolkit.sources;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.Map;

import javax.sql.DataSource;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.database.JdbcCursorItemReader;
import org.springframework.jdbc.core.ColumnMapRowMapper;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.client.io.Format;


@EnableBatchProcessing
public class SQLMDMSource extends MDMSource {
  private DataSource dataSource = null;
  private JsonNode itemDetails = null;

  @Override
  public ItemReader<? extends Map<String, Object>> sourceReader() {
    String driver = configuration.path("sqlDriver").asText();
    String jdbcURL = configuration.path("jdbcURL").asText();
    String jdbcUsername = configuration.path("jdbcUsername").asText();
    String jdbcPassword = configuration.path("jdbcPassword").asText();
    String sql = configuration.path("sql").asText();
    this.primaryKey = configuration.path("primaryKey").asText();
    this.itemDetails = configuration.path("itemDetails");

    try {
      dataSource = buildDataSource(driver, jdbcURL, jdbcUsername, jdbcPassword);
      dataSource.getConnection();
    } catch (Exception e) {
      logger.error("Exception", e);
    }
    JdbcCursorItemReader<Map<String, Object>> reader = new JdbcCursorItemReader<Map<String, Object>>();
    reader.setDataSource(dataSource);

    reader.setRowMapper(new ColumnMapRowMapper());
    reader.setSql(sql);
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
      if (value != null && !itemDetails.isMissingNode() && !itemDetails.path(key).isMissingNode()) {
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs;
        ResultSetMetaData rsmd;
        try {
          con = dataSource.getConnection();
          Iterator<JsonNode> elements = itemDetails.path(key).elements();
          while(elements.hasNext()) {
            JsonNode itemDetail = elements.next();
            String sql = itemDetail.path("sql").asText();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, value.toString());
            rs = pstmt.executeQuery();
            rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            String detailType = itemDetail.path("rootNode").asText();
            while (rs.next()) {
              sb.append("<").append(detailType).append(">");
              for (int i = 1; i <= columnCount; i++) {
                String name = rsmd.getColumnName(i);
                Object caseValue = rs.getObject(name);
                if (caseValue != null) {
                  sb.append("<").append(name).append(">");
                  sb.append(StringEscapeUtils.escapeXml10(caseValue.toString()));
                  sb.append("</").append(name).append(">");
                }
              }
              sb.append("</").append(detailType).append(">");
            }
            pstmt.close();
          }
        } catch (Exception e) {
          logger.error("Exception", e);
        } finally {
          if (con != null) {
            try {
              con.close();
            } catch (SQLException e) {
              logger.error("SQL Exception", e);
            }
          }
          if (pstmt != null) {
            try {
              pstmt.close();
            } catch (SQLException e) {
              logger.error("SQL Exception", e);
            }
          }
        }
      }
    }
    sb.append("</").append(rootName).append(">");
    return sb.toString();
  }

  /**
   * Protected so that a different data source can be used.
   */
  protected DataSource buildDataSource(String jdbcDriver, String jdbcURL, String jdbcUsername, String jdbcPassord) {
    DriverManagerDataSource ds = new DriverManagerDataSource();
    ds.setDriverClassName(jdbcDriver);
    ds.setUrl(jdbcURL);
    ds.setUsername(jdbcUsername);
    ds.setPassword(jdbcPassord);
    return ds;
  }
}
