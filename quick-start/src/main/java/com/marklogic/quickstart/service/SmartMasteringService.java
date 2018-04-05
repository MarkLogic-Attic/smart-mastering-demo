package com.marklogic.quickstart.service;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.extensions.ResourceManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.sun.jersey.api.client.ClientHandlerException;
import org.springframework.stereotype.Service;

@Service
public class SmartMasteringService {

    private final String MASTERING_STATS = "mastering-stats";

    public String getStats(DatabaseClient client) {
        return new GenericResourceManager(MASTERING_STATS, client).get();
    }

    class GenericResourceManager extends ResourceManager {
        public GenericResourceManager(String name, DatabaseClient client) {
            super();
            client.init(name, this);
        }

        public String get() {
            return get(new RequestParameters());
        }

        public String get(RequestParameters params) {
            try {
                ResourceServices.ServiceResultIterator resultItr = this.getServices().get(params);
                if (resultItr == null || ! resultItr.hasNext()) { return "{}"; }
                ResourceServices.ServiceResult res = resultItr.next();
                StringHandle handle = new StringHandle();
                return res.getContent(handle).get();
            }
            catch(ClientHandlerException e) {
            }
            return "{}";
        }
    }
}
