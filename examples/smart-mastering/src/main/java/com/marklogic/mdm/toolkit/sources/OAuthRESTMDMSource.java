package com.marklogic.mdm.toolkit.sources;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.commons.text.StringEscapeUtils;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.item.ItemReader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.client.io.Format;
import com.marklogic.mdm.toolkit.sources.RESTReader.ResponseType;

import com.google.gson.Gson;

@EnableBatchProcessing
public class OAuthRESTMDMSource extends MDMSource {

  private JsonNode itemDetails;
  private HttpEntity<String> httpEntity;
  private RestTemplate restTemplate;
  private String currentAccessToken;
  private Format format = Format.JSON;

  @Override
  public ItemReader<? extends Map<String, Object>> sourceReader() {
    this.primaryKey = configuration.path("primaryKey").asText();
    this.itemDetails = configuration.path("itemDetails");
    HttpHeaders headers = new HttpHeaders();
    headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
    headers.setContentType(MediaType.APPLICATION_JSON);
    String authHeader = "Bearer " + getAccessToken();
    headers.set("Authorization", authHeader);

    this.httpEntity = new HttpEntity<String>("parameters", headers);
    this.restTemplate = new RestTemplate();
    return new RESTReader(configuration.path("restURL").asText(), restTemplate, httpEntity);
  }

  @Override
  public Format sourceFormat() {
    return format;
  }

  public void setSourceFormat(Format format) {
    this.format = format;
  }

  @Override
  public String convertMapItemToDocument(Map<String, Object> item) {
    return convertMapItemToDocument(dataRootName.toLowerCase().replaceFirst("^[0-9]+\\-", ""), item, itemDetails);
  }

  @SuppressWarnings("unchecked")
  public String convertMapItemToDocument(String rootName, Map<String, Object> item, JsonNode itemDetails) {
    if (sourceFormat() == Format.XML) {
      StringBuilder sb = new StringBuilder();
      if (rootName != null) {
        sb.append("<").append(rootName).append(">");
      }
      for (String key : item.keySet()) {
        Object value = item.get(key);
        if (value instanceof Map<?, ?>) {
          sb.append(convertMapItemToDocument(key, (Map<String, Object>) value, itemDetails));
        }
        if (value instanceof List<?>) {
          List<?> valueList = (List<?>) value;
          for (Object subValue : valueList) {
            if (subValue instanceof Map<?, ?>) {
              sb.append(convertMapItemToDocument(key, (Map<String, Object>) subValue, null));
            } else {
              sb.append("<").append(key).append(">");
              if (subValue != null) {
                sb.append(StringEscapeUtils.escapeXml10(subValue.toString()));
              }
              sb.append("</").append(key).append(">");
            }
          }
        } else {
          sb.append("<").append(key).append(">");
          if (value != null) {
            sb.append(StringEscapeUtils.escapeXml10(value.toString()));
          }
          sb.append("</").append(key).append(">");
        }
        if (value != null && itemDetails != null && !itemDetails.isMissingNode()
            && !itemDetails.path(key).isMissingNode()) {
          try {
            Iterator<JsonNode> elements = itemDetails.path(key).elements();
            while (elements.hasNext()) {
              JsonNode itemDetail = elements.next();
              String url = itemDetail.path("URL").asText();
              String respType = itemDetail.path("type").asText();
              HttpHeaders headers = new HttpHeaders();
              headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
              headers.setContentType(MediaType.APPLICATION_JSON);
              String authHeader = "Bearer " + getAccessToken();
              logger.debug(url);
              logger.debug(authHeader);
              headers.set("Authorization", authHeader);

              HttpEntity<String> httpEntity = new HttpEntity<String>("parameters", headers);
              ItemReader<Map<String, Object>> subItemReader = new RESTReader(url, new RestTemplate(),
                  httpEntity, item,
                  "object".equals(respType) ? ResponseType.OBJECT : ResponseType.ARRAY);
              String subRootName = itemDetail.path("rootNode").asText();
              Map<String, Object> currentItem = subItemReader.read();
              while (currentItem != null) {
                sb.append(convertMapItemToDocument(subRootName, currentItem, null));
                currentItem = subItemReader.read();
              }
            }
          } catch (Exception e) {
            logger.error("Exception", e);
          }
        }
      }
      if (rootName != null) {
        sb.append("</").append(rootName).append(">");
      }
      return sb.toString();
    } else {
      Object[] keySet = item.keySet().toArray();
      for (Object keyObj:keySet) {
        String key = keyObj.toString();
        Object value = item.get(key);
        if (value != null && itemDetails != null && !itemDetails.isMissingNode()
            && !itemDetails.path(key).isMissingNode()) {
          try {
            Iterator<JsonNode> elements = itemDetails.path(key).elements();
            while (elements.hasNext()) {
              JsonNode itemDetail = elements.next();
              String url = itemDetail.path("URL").asText();
              String respType = itemDetail.path("type").asText();
              HttpHeaders headers = new HttpHeaders();
              headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
              headers.setContentType(MediaType.APPLICATION_JSON);
              String authHeader = "Bearer " + getAccessToken();
              logger.debug(url);
              logger.debug(authHeader);
              headers.set("Authorization", authHeader);

              HttpEntity<String> httpEntity = new HttpEntity<String>("parameters", headers);
              ItemReader<Map<String, Object>> subItemReader = new RESTReader(url, new RestTemplate(),
                  httpEntity, item,
                  "object".equals(respType) ? ResponseType.OBJECT : ResponseType.ARRAY);
              String subRootName = itemDetail.path("rootNode").asText();
              Map<String, Object> currentItem = subItemReader.read();
              JSONArray jsonArray = new JSONArray();
              while (currentItem != null) {
                jsonArray.put(currentItem);
                currentItem = subItemReader.read();
              }
              item.put(subRootName, jsonArray);
            }
          } catch (Exception e) {
            logger.error("Exception", e);
          }
        }
      }
      Gson gson = new Gson();
      return gson.toJson(item);
    }
  }

  private String getAccessToken() {
    if (currentAccessToken == null) {
      String oAuthTokenURL = configuration.path("OAuthTokenURL").asText();
      String oAuthClientID = configuration.path("OAuthClientID").asText();
      String oAuthClientSecret = configuration.path("OAuthClientSecret").asText();
      HttpClient client = HttpClientBuilder.create().build();
      HttpPost post = new HttpPost(oAuthTokenURL);

      // add header
      post.setHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded");
      post.setHeader(HttpHeaders.ACCEPT, "application/json");
      List<NameValuePair> urlParameters = new ArrayList<NameValuePair>();
      urlParameters.add(new BasicNameValuePair("client_id", oAuthClientID));
      urlParameters.add(new BasicNameValuePair("client_secret", oAuthClientSecret));
      urlParameters.add(new BasicNameValuePair("grant_type", "client_credentials"));

      UrlEncodedFormEntity urlEncodedFormEntity = null;
      try {
        urlEncodedFormEntity = new UrlEncodedFormEntity(urlParameters);
      } catch (UnsupportedEncodingException e3) {
        logger.error("Unsupported encoding", e3);
      }
      post.setEntity(urlEncodedFormEntity);
      HttpResponse response = null;
      try {
        response = client.execute(post);
      } catch (IOException e) {
        logger.error("IO exception", e);
      }

      BufferedReader rd = null;
      try {
        rd = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));
      } catch (UnsupportedOperationException e2) {
        logger.error("Unsupported operation", e2);
      } catch (IOException e2) {
        logger.error("IO exception", e2);
      }

      StringBuffer result = new StringBuffer();
      String line = "";
      try {
        while ((line = rd.readLine()) != null) {
          result.append(line);
        }
      } catch (IOException e1) {
        logger.error("IO exception", e1);
      }
      JSONObject o = null;
      try {
        o = new JSONObject(result.toString());
      } catch (JSONException e) {
        logger.error("JSON exception", e);
      }

      try {
        currentAccessToken = o.getString("access_token");
      } catch (JSONException e) {
        logger.error("JSON exception", e);
      }
    }
    return currentAccessToken;
  }

}
