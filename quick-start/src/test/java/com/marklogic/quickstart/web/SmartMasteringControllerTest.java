package com.marklogic.quickstart.web;

import com.marklogic.client.io.DocumentMetadataHandle;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import static org.junit.jupiter.api.Assertions.*;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@WebAppConfiguration
class SmartMasteringControllerTest extends BaseTestController {

    @Autowired
    private SmartMasteringController smc;

    // TODO: make this work when we get the core project ready
//    @Test
//    void getStats() {a
//        // Set up (not needed for other tests)
//
//        baseSetUp();
//        installHub();
//
//        DocumentMetadataHandle meta = new DocumentMetadataHandle();
//        meta.getCollections().add("mdm-content");
//        for (int i = 0; i < 5; i++) {
//            installFinalDoc("/doc" + i + ".xml", meta, "<testing/>");
//        }
//
//        meta.getCollections().add("mdm-merged");
//        for (int i = 5; i < 10; i++) {
//            installFinalDoc("/doc" + i + ".xml", meta, "<testing/>");
//        }
//
//        assertEquals(10, getFinalDocCount());
//
//        String stats = smc.getStats();
//        assertJsonEqual("{\"docCount\": 10, \"afterMergeCount\": 5}", stats, true);
//    }
}
