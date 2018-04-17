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
    private final String MASTERING_HISTORY_DOCUMENT = "sm-history-document";
    private final String MASTERING_HISTORY_PROPERTIES = "sm-history-properties";

    private DatabaseClient client;

    public SmartMasteringService(DatabaseClient client) {
        this.client = client;
    }

    public String getStats() {
        return new GenericResourceManager(MASTERING_STATS, client).get();
    }

    public String getDoc(String docUri) {
        GenericDocumentManager docMgr = client.newDocumentManager();
        return docMgr.readAs(docUri, String.class);
    }

    public String mergeDocs(String doc1, String doc2, String options) {
        RequestParameters params = new RequestParameters();
        params.add("primary-uri", doc1);
        params.add("secondary-uri", doc2);
        params.add("options", options);
        return new GenericResourceManager(MASTERING_MERGE, client).post(params, new StringHandle("").withFormat(Format.JSON));
    }

    public void unmerge(String uri) {
        RequestParameters params = new RequestParameters();
        params.add("mergedUri", uri);
        new GenericResourceManager(MASTERING_MERGE, client).delete(params);
    }

    public String getHistoryDocument(String uri) {
        RequestParameters params = new RequestParameters();
        params.add("uri", uri);
        return new GenericResourceManager(MASTERING_HISTORY_DOCUMENT, client).get(params);
    }

    public String getHistoryProperties(String uri) {
        RequestParameters params = new RequestParameters();
        params.add("uri", uri);
        return new GenericResourceManager(MASTERING_HISTORY_PROPERTIES, client).get(params);
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

        public void delete(RequestParameters params) {
            try {
                StringHandle handle = new StringHandle();
                this.getServices().delete(params, handle);
            }
            catch(ClientHandlerException e) {
            }
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
