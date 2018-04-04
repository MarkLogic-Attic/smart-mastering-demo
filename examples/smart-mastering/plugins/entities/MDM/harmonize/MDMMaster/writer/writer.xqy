xquery version "1.0-ml";

module namespace plugin = "http://marklogic.com/data-hub/plugins";
import module namespace auditing = "http://marklogic.com/agile-mastering/auditing"
  at "/ext/com.marklogic.agile-mastering/auditing/base.xqy";
import module namespace process = "http://marklogic.com/agile-mastering/process-records"
  at "/ext/com.marklogic.agile-mastering/process-records.xqy";

declare namespace agile-mastering = "http://marklogic.com/agile-mastering";
declare namespace es = "http://marklogic.com/entity-services";
declare namespace prov = "http://www.w3.org/ns/prov#";

declare option xdmp:mapping "false";

(:~
 : Writer Plugin
 :
 : @param $id       - the identifier returned by the collector
 : @param $envelope - the final envelope
 : @param $options  - a map containing options. Options are sent from Java
 :
 : @return - nothing
 :)
declare function plugin:write(
  $id as xs:string,
  $envelope as node(),
  $options as map:map) as empty-sequence()
{
  let $doc-collections := 
    xdmp:invoke-function(function() {
      xdmp:document-get-collections($id)
    }, map:new((map:entry("update","false"))))
  where 
    $doc-collections = "mdm-content" and 
    fn:not($doc-collections = "mdm-merged")
  return 
    let $_process := process:process-match-and-merge($id)
    return ()
};
