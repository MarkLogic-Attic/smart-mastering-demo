package com.marklogic.mdm.toolkit.sources;

import com.marklogic.client.document.DocumentWriteOperation;
import com.marklogic.client.io.marker.AbstractWriteHandle;
import com.marklogic.client.io.marker.DocumentMetadataWriteHandle;

public class MarkLogicWriteHandle implements DocumentWriteOperation {

  private String uri = null;
  private OperationType operationType = null;
  private DocumentMetadataWriteHandle metadata = null;
  private AbstractWriteHandle content = null;
  private String temporalDocumentURI = null;


  public MarkLogicWriteHandle(String uri, DocumentMetadataWriteHandle metadata, AbstractWriteHandle content) {
    this.uri = uri;
    this.metadata = metadata;
    this.content = content;
  }

  public void setUri(String uri) {
    this.uri = uri;
  }

  public void setOperationType(OperationType operationType) {
    this.operationType = operationType;
  }

  public void setMetadata(DocumentMetadataWriteHandle metadata) {
    this.metadata = metadata;
  }

  public void setContent(AbstractWriteHandle content) {
    this.content = content;
  }

  public void setTemporalDocumentURI(String temporalDocumentURI) {
    this.temporalDocumentURI = temporalDocumentURI;
  }

  @Override
  public OperationType getOperationType() {
    return this.operationType;
  }

  @Override
  public String getUri() {
    return this.uri;
  }

  @Override
  public DocumentMetadataWriteHandle getMetadata() {
    return this.metadata;
  }

  @Override
  public AbstractWriteHandle getContent() {
    return this.content;
  }

  @Override
  public String getTemporalDocumentURI() {
    return this.temporalDocumentURI;
  }

}
