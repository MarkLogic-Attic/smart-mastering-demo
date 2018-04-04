package com.marklogic.quickstart.web;

import com.marklogic.quickstart.EnvironmentAware;
import com.marklogic.quickstart.service.SmartMasteringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/api")
public class SmartMasteringController extends EnvironmentAware {

    @Autowired
    SmartMasteringService smartMasteringService;

    @GetMapping("/mastering/stats")
    @ResponseBody
    String getStats() {
        return smartMasteringService.getStats(envConfig().getFinalClient());
    }
}
