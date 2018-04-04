xquery version '1.0-ml';

import module namespace trgr = 'http://marklogic.com/xdmp/triggers' at '/MarkLogic/triggers.xqy';
import module namespace process = "http://marklogic.com/agile-mastering/process-records"
  at "process-records.xqy";

declare option xdmp:mapping "false";

declare variable $trgr:uri as xs:string external;

if (xdmp:document-get-collections($trgr:uri) = "mdm-merged") then
  ()
else (
  process:process-match-and-merge($trgr:uri)
)