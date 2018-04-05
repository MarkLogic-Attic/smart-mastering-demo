package com.marklogic.quickstart.web;

import com.marklogic.quickstart.EnvironmentAware;
import com.marklogic.quickstart.service.SmartMasteringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

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

    @RequestMapping(value = "/mastering/doc", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<String> getDoc(@RequestParam String docUri) {
        HttpHeaders headers = new HttpHeaders();
        String body = smartMasteringService.getDoc(envConfig().getFinalClient(), docUri);
        if (body.startsWith("<")) {
            headers.setContentType(MediaType.APPLICATION_XML);
        } else {
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        }
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }
}
