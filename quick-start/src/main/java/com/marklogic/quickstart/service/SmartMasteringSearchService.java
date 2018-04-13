package com.marklogic.quickstart.service;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.document.GenericDocumentManager;
import com.marklogic.client.document.ServerTransform;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StructuredQueryBuilder;
import com.marklogic.client.query.StructuredQueryDefinition;
import com.marklogic.hub.HubConfig;
import com.marklogic.quickstart.model.SearchQuery;

import java.util.ArrayList;

public class SmartMasteringSearchService extends SearchableService {
    private QueryManager finalQueryMgr;
    private GenericDocumentManager finalDocMgr;

    public SmartMasteringSearchService(HubConfig hubConfig) {
        DatabaseClient finalClient = hubConfig.newFinalClient();
        this.finalQueryMgr = finalClient.newQueryManager();
        this.finalDocMgr = finalClient.newDocumentManager();
    }

    public StringHandle search(SearchQuery searchQuery) {
        finalQueryMgr.setPageLength(searchQuery.count);

        StructuredQueryBuilder sb;

        ArrayList<StructuredQueryDefinition> queries = new ArrayList<>();

        sb = finalQueryMgr.newStructuredQueryBuilder("smart-mastering-core-options");

        if (searchQuery.facets != null) {
            searchQuery.facets.entrySet().forEach(entry -> entry.getValue().forEach(value -> {
                StructuredQueryDefinition def;

                if (entry.getKey().equals("Collection")) {
                    def = sb.collectionConstraint(entry.getKey(), value);
                }
                else {
                    def = addRangeConstraint(sb, entry.getKey(), value);
                }

                if (def != null) {
                    queries.add(def);
                }
            }));
        }

        StructuredQueryDefinition sqd = sb.and(queries.toArray(new StructuredQueryDefinition[0]));
        sqd.setCriteria(searchQuery.query);
        sqd.setResponseTransform(new ServerTransform("mdmResults"));

        StringHandle sh = new StringHandle();
        sh.setFormat(Format.JSON);
        return finalQueryMgr.search(sqd, sh, searchQuery.start);
    }

    public String getDoc(String docUri) {
        return finalDocMgr.readAs(docUri, String.class, new ServerTransform("get-instance"));
    }
}
