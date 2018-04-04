xquery version "1.0-ml";

module namespace auditing = "http://marklogic.com/agile-mastering/auditing";

import module namespace diff = "http://marklogic.com/demo/xml-diff"
  at "/ext/mlpm_modules/marklogic-xml-diff/diff.xqy"; 
import module namespace mem = "http://maxdewpoint.blogspot.com/memory-operations/functional"
  at "/ext/mlpm_modules/XQuery-XML-Memory-Operations/memory-operations-functional.xqy";
import module namespace sem = "http://marklogic.com/semantics"
  at "/MarkLogic/semantics.xqy";


import module namespace xq3 = "http://maxdewpoint.blogspot.com/xq3-ml-extensions"
  at "/ext/mlpm_modules/xq3-ml-extensions/xq3.xqy";

declare namespace prov = "http://www.w3.org/ns/prov#";
declare namespace foaf = "http://xmlns.com/foaf/0.1/";
declare namespace am = "http://marklogic.com/agile-mastering/auditing#";
declare namespace rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace rdfs = "http://www.w3.org/2000/01/rdf-schema#";

declare variable $auditing:MERGE-ACTION := "merge";
declare variable $auditing:UPDATE-ACTION := "update";
declare variable $auditing:ROLLBACK-ACTION := "rollback";

declare variable $prov-prefix := fn:namespace-uri-from-QName(xs:QName("prov:document"));
declare variable $foaf-prefix := fn:namespace-uri-from-QName(xs:QName("foaf:document"));
declare variable $am-prefix := fn:namespace-uri-from-QName(xs:QName("am:document"));
declare variable $rdf-prefix := fn:namespace-uri-from-QName(xs:QName("rdf:document"));
declare variable $rdfs-prefix := fn:namespace-uri-from-QName(xs:QName("rdfs:document"));

declare function auditing:audit-trace(
  $action, 
  $previous-uris, 
  $new-uri, 
  $attachments
) {
  let $dateTime := fn:current-dateTime()
  let $username := xdmp:get-current-user()
  let $new-entity-id := $am-prefix||$new-uri
  let $activity-id := ($am-prefix||$action||"-"||$new-uri || "-" || xdmp:request())
  let $user-id := ($am-prefix||"user-"||$username)
  let $attribution-id := ($am-prefix||"attribution-"||$username||"-"||sem:uuid-string())
  let $prov-xml := 
    element {fn:QName($prov-prefix, "document")} {
      namespace foaf {$foaf-prefix},
      namespace prov {$prov-prefix},
      namespace am {$am-prefix},
      namespace xsd {"http://www.w3.org/2001/XMLSchema"},
      element auditing:new-uri { $new-uri },
      $previous-uris ! element auditing:previous-uri { . },
      element {fn:QName($prov-prefix, "activity")} {
        attribute {fn:QName($prov-prefix, "id")} {
          $activity-id
        },
        element {fn:QName($prov-prefix, "type")} {
          attribute xsi:type {"xsd:string"},
          $action
        }, 
        element {fn:QName($prov-prefix, "label")} { 
          $action || " by " || $username 
        }
      },
      let $previous-entities := 
        for $previous-uri in $previous-uris
        return (
          element {fn:QName($prov-prefix, "collection")} {
            attribute {fn:QName($prov-prefix, "id")} {
              $am-prefix||$previous-uri
            },
            element {fn:QName($prov-prefix, "type")} {
              attribute xsi:type {"xsd:string"},
              "contributing record for " || $action
            },
            element {fn:QName($prov-prefix, "label")} {$previous-uri}
          }
        )
      let $new-entity := 
        element {fn:QName($prov-prefix, "collection")} {
          attribute {fn:QName($prov-prefix, "id")} {
            $am-prefix||$new-uri
          },
          element {fn:QName($prov-prefix, "type")} {
            attribute xsi:type {"xsd:string"},
            "result of record " || $action
          },
          element {fn:QName($prov-prefix, "label")} {$new-uri}
        }
      return (
        $previous-entities,
        $new-entity,
        for $previous-entity in $previous-entities
        return
          element {fn:QName($prov-prefix, "wasDerivedFrom")} {
            element {fn:QName($prov-prefix, "generatedEntity")} {
              attribute {fn:QName($prov-prefix, "ref")} {
                $new-entity-id
              }
            },
            element {fn:QName($prov-prefix, "usedEntity")} {
              attribute {fn:QName($prov-prefix, "ref")} {
                fn:string($previous-entity/@*:id)
              }
            },
            element {fn:QName($prov-prefix, "activity")} {
              attribute {fn:QName($prov-prefix, "ref")} {
                $activity-id
              }
            }
          }
      ),
      element {fn:QName($prov-prefix, "agent")} {
        attribute {fn:QName($prov-prefix, "id")} {
          $user-id
        },
        element {fn:QName($prov-prefix, "type")} {
          attribute xsi:type {"xsd:QName"},
          "foaf:OnlineAccount"
        },
        element {fn:QName($foaf-prefix, "accountName")} {$username}
      },
      element {fn:QName($prov-prefix, "wasAttributedTo")} {
        element {fn:QName($prov-prefix, "entity")} {
          attribute {fn:QName($prov-prefix, "ref")} {
            $new-entity-id
          }
        },
        element {fn:QName($prov-prefix, "agent")} {
          attribute {fn:QName($prov-prefix, "ref")} {
            $user-id
          }
        }
      },
      element {fn:QName($prov-prefix, "wasGeneratedBy")} {
        element {fn:QName($prov-prefix, "entity")} {
          attribute {fn:QName($prov-prefix, "ref")} {
            $new-entity-id
          }
        },
        element {fn:QName($prov-prefix, "activity")} {
          attribute {fn:QName($prov-prefix, "ref")} {
            $activity-id
          }
        },
        element {fn:QName($prov-prefix, "time")} {
          $dateTime
        }
      },
      $attachments
    }
  return
    xdmp:document-insert(
      "/com.marklogic.agile-mastering/auditing/"|| $action ||"/"||sem:uuid-string()||".xml", 
      element {fn:QName($prov-prefix, "document")} {
        $prov-xml/node(),
        auditing:build-semantic-info($prov-xml)
      }, 
      (
        xdmp:default-permissions(),
        xdmp:permission("mdm-user", "read"),
        xdmp:permission("mdm-admin", "update")
      ),
      "mdm-auditing"
    )
};

declare function auditing:auditing-receipts-for-doc-uri(
    $doc-uri
) {
  cts:search(fn:collection("mdm-auditing")/prov:document,
    cts:element-value-query(
      xs:QName("auditing:new-uri"), 
      $doc-uri,
      "exact"
    )
  )
};

declare function auditing:auditing-receipts-for-doc-history(
    $doc-uri
) {
  auditing:auditing-receipts-for-doc-history(
    $doc-uri,
    ()
  )
};

declare function auditing:auditing-receipts-for-doc-history(
    $doc-uris, 
    $returned-docs
) {
  if (fn:exists($doc-uris)) then
    let $new-provs := 
      cts:search(fn:collection("mdm-auditing")/prov:document,
        cts:and-query((
          cts:element-value-query(
            (
              xs:QName("auditing:previous-uri"),
              xs:QName("auditing:new-uri")
            ), 
            $doc-uris,
            "exact"
          ),
          cts:not-query(cts:document-query($returned-docs ! xdmp:node-uri(.)))
        ))
      )
    return
      auditing:auditing-receipts-for-doc-history(
        fn:distinct-values($new-provs/(auditing:previous-uri|auditing:new-uri))[fn:not(. = $doc-uris)],
        (
          $new-provs,
          $returned-docs
        )
      )
  else
    $returned-docs
};

declare function auditing:audit-trace-rollback(
    $prov-xml
) {
  let $merged-uri := 
    fn:string(
      $prov-xml/prov:collection[fn:starts-with(prov:type, "result of record ")]/prov:label
    )
  for $entity in $prov-xml/prov:collection[fn:starts-with(prov:type, "contributing record for ")]
  let $orig-uri := 
    fn:string(
      $entity/prov:label
    )
  return
    auditing:audit-trace(
      $auditing:ROLLBACK-ACTION, 
      $merged-uri, 
      $orig-uri, 
      ()
    )
};

declare function auditing:build-semantic-info(
  $prov-xml
) {
  let $dateTime := $prov-xml/prov:wasGeneratedBy/prov:time ! xs:dateTime(.)
  let $agent := $prov-xml/prov:agent
  let $agent-iri := sem:iri(fn:string($agent/@prov:id))
  let $username := fn:string($agent/foaf:accountName)
  let $attribution-iri := sem:iri($am-prefix||"attribution-"||$username||"-"||sem:uuid-string())
  let $activity := $prov-xml/prov:activity
  let $activity-iri := sem:iri(fn:string($activity/@prov:id))
  let $action := fn:string($activity/prov:type)
  let $entities := $prov-xml//(prov:collection|prov:entity|prov:bundle)[fn:exists(@prov:id)]
  let $previous-entities := $entities[fn:starts-with(prov:type, "contributing record for ")]
  let $new-entity := $entities[fn:starts-with(prov:type, "result of record ")]
  let $new-entity-iri := sem:iri(fn:string($new-entity/@prov:id))
  let $auditing-managed-triples := (
      if (auditing:subject-not-stored(fn:string($agent-iri))) then (
        sem:triple(
          $agent-iri, 
          sem:iri($rdf-prefix||"type"),
          sem:iri($foaf-prefix||"OnlineAccount")
        ),
        sem:triple(
          $agent-iri, 
          sem:iri($foaf-prefix||"accountName"),
          $username
        ),
        sem:triple(
          $agent-iri, 
          sem:iri($rdfs-prefix||"label"),
          $username
        )
      ) else (),
      for $software-agent in $prov-xml/prov:softwareAgent
      let $iri := sem:iri($software-agent/@prov:id)
      where auditing:subject-not-stored(fn:string($iri))
      return
        (
          sem:triple(
            $iri,
            sem:iri($rdf-prefix||"type"),
            sem:iri($prov-prefix||"SoftwareAgent") 
          ),
          sem:triple(
            $iri,
            sem:iri($rdfs-prefix||"label"),
            fn:string($software-agent/prov:label) 
          ),
          sem:triple(
            $iri,
            sem:iri($prov-prefix||"atLocation"),
            fn:string($software-agent/prov:location) 
          )
        ),
      for $entity in $entities
      return
        auditing:build-entity-managed-triples($entity, $prov-xml)
    )
  return (
    if (fn:exists($auditing-managed-triples)) then
      sem:graph-insert(
        sem:iri("mdm-auditing"),
        $auditing-managed-triples,
        (
          xdmp:default-permissions(),
          xdmp:permission("mdm-user", "read"),
          xdmp:permission("mdm-admin", "update")
        ),
        "mdm-auditing"
      )
    else (),
    element sem:triples {
      sem:triple(
        $attribution-iri, 
        sem:iri($rdf-prefix||"type"),
        sem:iri($prov-prefix||"Attribution")
      ),
      sem:triple(
        $attribution-iri, 
        sem:iri($prov-prefix||"agent"),
        $agent-iri
      ),
      sem:triple(
        $attribution-iri, 
        sem:iri($rdf-prefix||"type"),
        "authorship"
      ),
      sem:triple(
        $activity-iri, 
        sem:iri($rdf-prefix||"type"),
        sem:iri($prov-prefix||"Activity")
      ),
      sem:triple(
        $activity-iri, 
        sem:iri($rdf-prefix||"type"),
        sem:iri($prov-prefix||"Activity")
      ),
      sem:triple(
        $activity-iri, 
        sem:iri($rdfs-prefix||"label"),
        $action || " by " || $username
      ),
      sem:triple(
        $activity-iri, 
        sem:iri($prov-prefix||"atTime"),
        $dateTime
      ),
      sem:triple(
        $activity-iri,
        sem:iri($prov-prefix||"wasAssociatedWith"),
        $agent-iri
      ),
      sem:triple(
        $new-entity-iri,
        sem:iri($prov-prefix||"wasGeneratedBy"),
        $activity-iri
      ),
      for $influence in $prov-xml/prov:wasInfluencedBy
      return (
        sem:triple(
          sem:iri($influence/prov:influencee/@prov:ref),
          sem:iri($prov-prefix||"wasInfluencedBy"),
          sem:iri($influence/prov:influencer/@prov:ref)
        ),
        sem:triple(
          sem:iri($influence/prov:influencer/@prov:ref),
          sem:iri($prov-prefix||"influenced"),
          sem:iri($influence/prov:influencee/@prov:ref)
        )
      ),
      for $previous-entity in $previous-entities
      let $previous-entity-iri := sem:iri(fn:string($previous-entity/@prov:id))
      return (
        sem:triple(
          $new-entity-iri,
          sem:iri($prov-prefix||"wasDerivedFrom"),
          $previous-entity-iri
        ),
        sem:triple(
          $previous-entity-iri,
          sem:iri($prov-prefix||"wasInvalidatedBy"),
          $activity-iri
        )
      ),
      sem:triple(
        $new-entity-iri,
        sem:iri($prov-prefix||"wasAttributedTo"),
        $agent-iri
      )
    }
  )
};

declare function auditing:build-entity-managed-triples(
  $entity,
  $prov-xml
) {
  let $entity-id := fn:string($entity/@prov:id)
  let $entity-iri := sem:iri($entity-id)
  let $collection-members := $prov-xml/prov:hadMember[prov:collection/@prov:ref = $entity-id]
  return
  (
    if (auditing:subject-not-stored($entity-id)) then (
        if ($entity instance of element(prov:collection)) then (
          let $collection-members := $prov-xml/prov:hadMember[prov:collection/@prov:ref = $entity-id]
          for $member-id in $collection-members/prov:entity/(@prov:ref|@prov:id)
          return
            sem:triple(
              $entity-iri, 
              sem:iri($prov-prefix||"hadMember"),
              sem:iri($member-id)
            ),
          sem:triple(
            $entity-iri, 
            sem:iri($rdf-prefix||"type"),
            sem:iri($prov-prefix||"Collection")
          )
        ) else (),
        sem:triple(
          $entity-iri, 
          sem:iri($rdf-prefix||"type"),
          sem:iri($prov-prefix||"Entity")
        ),
        sem:triple(
          $entity-iri, 
          sem:iri($am-prefix||"document-uri"),
          fn:string($entity/prov:label)
        ),
        sem:triple(
          $entity-iri, 
          sem:iri($rdfs-prefix||"label"),
          fn:string($entity/prov:label)
        )
      ) else ()
  )
};


declare function auditing:reverse-change-set($node as node())
{
  typeswitch ($node)
  case element(diff:addition) return 
    element diff:removal {
      $node/@*,
      fn:map(auditing:reverse-change-set#1, $node/node())
    }
  case element(diff:removal) return 
    element diff:addition {
      $node/@*,
      fn:map(auditing:reverse-change-set#1, $node/node())
    }
  case element() return 
    element {fn:node-name($node)} {
      fn:map(auditing:reverse-change-set-attributes#1,$node/@*),
      fn:map(auditing:reverse-change-set#1, $node/node())
    }
  default return
    $node
};

declare function auditing:reverse-change-set-attributes($node as attribute())
{
  typeswitch ($node)
  case attribute(diff:addition) return 
    attribute diff:removal {
      fn:string($node)
    }
  case attribute(diff:removal) return 
    attribute diff:addition {
      fn:string($node)
    }
  default return
    $node
};

declare function auditing:subject-not-stored($iri-str) 
{
  xdmp:estimate(
    cts:search(
      fn:collection("mdm-auditing"),
      cts:element-value-query(
        xs:QName("sem:subject"), 
        $iri-str,
        "exact"
      )
    ),
    1
  ) = 0
};

