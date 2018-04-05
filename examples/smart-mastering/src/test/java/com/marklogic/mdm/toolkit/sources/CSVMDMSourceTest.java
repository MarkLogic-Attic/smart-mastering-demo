package com.marklogic.mdm.toolkit.sources;

import org.junit.jupiter.api.Test;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;

class CSVMDMSourceTest {

  private CSVMDMSource source = new CSVMDMSource();

  @Test
  void convertMapItemToDocument() {
    HashMap<String, Object> items = new HashMap<String, Object>();
    items.put("field1", "value1");
    items.put("field2", new Integer(2));
    items.put("field3", "value with spaces");

    String actual = source.convertMapItemToDocument(items);
    // Can't do a full String comparison, because the element order is undefined
    String root = source.getDataRootName();
    String[] targets = {
      "<" + root + ">.*</" + root + ">",
      ".*<field1>value1</field1>.*",
      ".*<field2>2</field2>.*",
      ".*<field3>value with spaces</field3>.*"
    };
    for (String target : targets) {
      assertTrue(actual.matches(target), actual + " does not include " + target);
    }
  }
}
