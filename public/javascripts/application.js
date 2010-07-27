$(function() {
  
  if (typeof slug !== "undefined" && slug !== null ) {
    
    $("input#share_url").click(function() {$(this).select()});
    
    $("span.highlight").click(triggerHighlights);
    
    if (entityCount == 0) {
      $("div#extracted_entities").hide();
    }
    
    var doneStatus = "Contributors Identified";
    var ranEntitiesExtracted = false;
    var ranEntitiesLinked = false;
    var ranContributorsIdentified = false;
    
    if (location.hash == "#done" && resultStatus != doneStatus) {
      $.getJSON(slug + '.json', function(result) {
        result.status = "Entities Extracted";
        if (ranEntitiesExtracted == false) {
          ranEntitiesExtracted = entitiesExtracted(result);
        }
        result.status = "Entities Linked";      
        if (ranEntitiesExtracted == true && ranEntitiesLinked == false) {
          ranEntitiesLinked = entitiesLinked(result);
        }
        result.status = "Contributors Identified";
        if (ranEntitiesLinked == true && ranContributorsIdentified == false) {
          ranContributorsIdentified = contributorsIdentified(result);
        }
      });
      
    } else if (resultStatus != doneStatus) {
      $("div#processingBar").fadeIn("slow");
      var intervalId = setInterval(function() { 
        $.getJSON(slug + '.json', function(result) {
                   
          // break the loop if done
          if (result.status == doneStatus) {
            $("div#processingBar").slideUp();
            location.hash = 'done';
            clearInterval(intervalId);
          }
          
          if (ranEntitiesExtracted == false) {
            ranEntitiesExtracted = entitiesExtracted(result);
          }        
          if (ranEntitiesExtracted == true && ranEntitiesLinked == false) {
            ranEntitiesLinked = entitiesLinked(result);
          }
          if (ranEntitiesLinked == true && ranContributorsIdentified == false) {
            ranContributorsIdentified = contributorsIdentified(result);
          }
        });
      }, 2000);
    }
  }
  
});

var triggerHighlights = function() {
  var mySpan = $(this);
  $("#rtColumn a[data-entity*='" + $(this).attr('data-entity') + "']").each(function() {
    mySpan.effect("transfer", { to: $(this) }, 1000);
  });
}

var entitiesExtracted = function(result, processedStatus) {
  var showEntities = false
  if (result.status == "Entities Extracted" && !_(result.entities).isEmpty()) {
    
    // populate the entities table
    _(result.entities).each(function(e) {
      $("div#extracted_entities ul").append('<li>' + e.name  + '</li>').fadeIn();
      showEntities = true;
    });
    if (showEntities) {
      $("div#extracted_entities").fadeIn();
    }
    return true;
  } else {
    return false;
  }
}

var entitiesLinked = function(result, processedStatus) {
  if ((result.status == "Entities Linked" || result.status == "Contributors Identified") && !_(result.entities).isEmpty()) {

    // highlight the source text
    $("div#source_content").highlight(_(result.entities).map(
                                        function(e) { 
                                          if (e.tdata_id) { return e.name; } 
                                          else { return ""; }
                                         }));
    $("span.highlight").attr("data-entity", function() { return $(this).text(); });
    
    // link to Influence Explorer
    _(result.entities).each(function(e) {

      if (e.tdata_id) {
        
        if (e.tdata_count > 0) {
          var entityEntry = "<li>" + influence_explorer_url(e) + "<br />" + breakdown_chart(e) + "</li>";
        } else {
          var entityEntry = "<li>" + influence_explorer_url(e) + "</li>";
        }
                
        $("div#extracted_entities ul li:contains('" + e.name  + "')").replaceWith(entityEntry);
      } else {
        $("div#extracted_entities ul li:contains('" + e.name  + "')").fadeOut();
      }
      
    });
    return true;
  } else {
    return false;
  }
}

var contributorsIdentified = function(result, processedStatus) {
  var showReport = false;
  if (result.status == "Contributors Identified" && !_(result.entities).isEmpty()) {
    
    // list all contributor/recipient relationships
    _(result.entities).each(function(e) {
      if (e.contributors) {
        _(e.contributors).each(function(contributor) {
          $("div#contribution_report ul").append('<li>' + influence_explorer_url(contributor) + 
                                                 ' has donated $' +  commafy(contributor.amount) +
                                                 ' to ' + influence_explorer_url(e) + '</li>');
          showReport = true;
        });
      }
    });
    if (showReport) {
      $("div#contribution_report").fadeIn();
    }
    $("span.highlight").click(triggerHighlights);

    return true;
  } else {
    return false;
  }
}

var influence_explorer_url = function(entity) {

  var entityName = entity.name;
  if (!_.isUndefined(entity.extracted_name)) {
    entityName = entity.extracted_name;
  }
  return '<a href="http://beta.influenceexplorer.com/' + entity.tdata_type + 
         '/' + entity.tdata_slug + '/' + entity.tdata_id + '" data-entity="' +  entityName + '">' + entity.name +'</a>'
}

var breakdown_chart = function(entity) {
  var url = "http://chart.apis.google.com/chart?cht=p&chf=bg,s,F3F4EE&chp=1.57";
    
  if (entity.tdata_type == "politician") {
    url += "&chs=140x50";
    url += "&chco=ABDEBF|169552";
    url += "&chd=t:" + entity.contributor_breakdown.individual + "," + entity.contributor_breakdown.pac;
    url += "&chdl=Individuals|PACs";
  } else if (entity.tdata_type == "organization" || entity.tdata_type == "individual") {
    url += "&chs=145x50";
    url += "&chco=3072F3|DB2A3F";
    url += "&chd=t:" + entity.recipient_breakdown.dem + ',' + entity.recipient_breakdown.rep;
    url += "&chdl=Democrats|Republicans";
  }
  return "<img src='" + url + "' />";
}

var commafy = function(amount) {
  amount += '';
  arr = amount.split('.');
  dollars = arr[0];
  cents = arr.length > 1 ? '.' + arr[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(dollars)) {
    dollars = dollars.replace(rgx, '$1' + ',' + '$2');
  }
  return dollars + cents;
}