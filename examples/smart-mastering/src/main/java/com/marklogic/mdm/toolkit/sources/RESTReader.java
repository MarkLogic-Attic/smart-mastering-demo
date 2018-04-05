package com.marklogic.mdm.toolkit.sources;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.batch.item.ItemReader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.marklogic.client.ext.helper.LoggingObject;

class RESTReader extends LoggingObject implements ItemReader<Map<String, Object>> {

  private final String apiUrl;
  private final RestTemplate restTemplate;
  private final HttpEntity<String> httpEntity;
  private final ResponseType responseType;

  private int nextItemIndex;
  private List<? extends Map<String, Object>> responseData;
  private Map<String, Object> variables;

  RESTReader(String apiUrl, RestTemplate restTemplate, HttpEntity<String> httpEntity) {
    this.apiUrl = apiUrl;
    this.restTemplate = restTemplate;
    this.httpEntity = httpEntity;
    this.variables = new HashMap<String, Object>();
    this.responseType = ResponseType.ARRAY;
    nextItemIndex = 0;
  }

  RESTReader(String apiUrl, RestTemplate restTemplate, HttpEntity<String> httpEntity, Map<String, Object> variables,
      ResponseType responseType) {
    this.apiUrl = apiUrl;
    this.restTemplate = restTemplate;
    this.httpEntity = httpEntity;
    this.variables = variables;
    this.responseType = responseType;
    nextItemIndex = 0;
  }

  @Override
  public Map<String, Object> read() throws Exception {
    if (itemDataIsNotInitialized()) {
      responseData = fetchItemDataFromAPI();
    }

    Map<String, Object> nextItem = null;

    if (nextItemIndex < responseData.size()) {
      nextItem = responseData.get(nextItemIndex);
      nextItemIndex++;
    }

    return nextItem;
  }

  private boolean itemDataIsNotInitialized() {
    return this.responseData == null;
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  private List<Map<String, Object>> fetchItemDataFromAPI() {
    try {
      if (responseType == ResponseType.ARRAY) {
        ResponseEntity<List> responseList = restTemplate.exchange(apiUrl, HttpMethod.GET, httpEntity,
            List.class, variables);
        return responseList.getBody();
      } else if (responseType == ResponseType.OBJECT) {
        ResponseEntity<Map> responseMap = restTemplate.exchange(apiUrl, HttpMethod.GET, httpEntity, Map.class,
            variables);
        List<Map<String, Object>> itemData = new ArrayList<Map<String, Object>>();
        itemData.add(responseMap.getBody());
        return itemData;
      }
    } catch (Exception e) {
      logger.warn("Call to " + apiUrl + " didn't succeed");
      try {
        Thread.sleep(1);
      } catch (InterruptedException e1) {

      }
    }
    return new ArrayList<Map<String, Object>>();
  }

  public enum ResponseType {
    ARRAY, OBJECT
  }

}
