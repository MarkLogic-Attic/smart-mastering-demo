package com.marklogic.quickstart.service;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.document.GenericDocumentManager;
import com.marklogic.client.document.ServerTransform;
import com.marklogic.client.extensions.ResourceManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.io.marker.AbstractWriteHandle;
import com.marklogic.client.util.RequestParameters;
import com.sun.jersey.api.client.ClientHandlerException;
import org.springframework.stereotype.Service;

@Service
public class SmartMasteringService {

    private final String MASTERING_STATS = "mastering-stats";
    private final String MASTERING_MERGE = "sm-merge";

    private DatabaseClient client;

    public SmartMasteringService(DatabaseClient client) {
        this.client = client;
    }

    public String getStats() {
        return new GenericResourceManager(MASTERING_STATS, client).get();
    }

    public String getDoc(String docUri) {
        GenericDocumentManager docMgr = client.newDocumentManager();
        return docMgr.readAs(docUri, String.class, new ServerTransform("get-instance"));
    }

    public void mergeDocs(String doc1, String doc2, String options) {
        RequestParameters params = new RequestParameters();
        params.add("primary-uri", doc1);
        params.add("secondary-uri", doc2);
        params.add("options", options);
        new GenericResourceManager(MASTERING_MERGE, client).post(params, new StringHandle("").withFormat(Format.JSON));
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

        public String post(RequestParameters params, AbstractWriteHandle input) {
            try {
                ResourceServices.ServiceResultIterator resultItr = this.getServices().post(params, input);
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
