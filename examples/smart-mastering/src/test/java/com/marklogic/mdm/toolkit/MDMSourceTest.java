package com.marklogic.mdm.toolkit;

import cucumber.api.PendingException;
import cucumber.api.java8.En;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
public class MDMSourceTest implements En {
  public MDMSourceTest() {
    Given("I have (\\d+) cukes in my belly", (Integer cukes) -> {
      System.out.format("Cukes: %n\n", cukes);
    });

    When("^I run a failing step$", () -> {
      // Write code here that turns the phrase above into concrete actions
      throw new PendingException();
    });
  }
}
