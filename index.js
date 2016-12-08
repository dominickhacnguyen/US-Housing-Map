d3.csv("totalData2.csv", function(err, data) {

  var config = {"color1":"#d3e5ff","color2":"#08306B","stateDataColumn":"state","defaultValue":"percentInApartments","state":"state"};
  
  var WIDTH = 800, HEIGHT = 500;

  var COLOR_COUNTS = 50;
  
  var SCALE = 0.7;
  
  function Interpolate(start, end, steps, count) {
      var s = start,
          e = end,
          final = s + (((e - s) / steps) * count);
      return Math.floor(final);
  }
  
  function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
          r = _r;
          g = _g;
          b = _b;
      };
  
      setColors(_r, _g, _b);
      this.getColors = function() {
          var colors = {
              r: r,
              g: g,
              b: b
          };
          return colors;
      };
  }
  
  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }
  
  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }
  
  var fields = Object.keys(data[0]);
  var option_select = d3.select('#selectors').append("select")
      .attr("class", "option-select");
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] !== config.state) {
      var opt = option_select.append("option")
        .attr("value", fields[i])
        .text(fields[i]);
      
      if (fields[i] === config.defaultValue) {
        opt.attr("selected", "true");
      }
    }
  }
  
  var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
  
  var rgb = hexToRgb(COLOR_FIRST);
  
  var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
  
  rgb = hexToRgb(COLOR_LAST);
  var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
  
  var width = WIDTH,
      height = HEIGHT;
  
  var startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();
  
  var colors = [];
  
  for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }
  
  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
  
  var path = d3.geo.path();
  
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    
    var name_id_map = {};
    var id_name_map = {};
    
    for (var i = 0; i < names.length; i++) {
      name_id_map[names[i].name] = names[i].id;
      id_name_map[names[i].id] = names[i].name;
    }
    
    var dataMap = {};
    
    data.forEach(function(d) {
      if (!dataMap[d[config.state]]) {
        dataMap[d[config.state]] = {};
      }
      
      for (var i = 0; i < Object.keys(data[0]).length; i++) {
        if (Object.keys(data[0])[i] !== config.state) {
          dataMap[d[config.state]][Object.keys(data[0])[i]] =
            +d[Object.keys(data[0])[i]];
        }
      }
    });
    
    function drawMap(dataColumn) {
      var valueById = d3.map();
      
      data.forEach(function(d) {
        var id = name_id_map[d[config.state]];
        valueById.set(id, +d[dataColumn]); 
      });
      
      quantize.domain([d3.min(data, function(d){ return +d[dataColumn] }),
        d3.max(data, function(d){ return +d[dataColumn] })]);
    
      svg.append("g")
          .attr("class", "states-choropleth")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
          .attr("transform", "scale(" + SCALE + ")")
          .style("fill", function(d) {
            if (valueById.get(d.id)) {
              var i = quantize(valueById.get(d.id));
              var color = colors[i].getColors();
              return "rgb(" + color.r + "," + color.g +
                  "," + color.b + ")";
            } else {
              return "";
            }
          })
          .attr("d", path)
          .on("mousemove", function(d) {
              
          $(this).attr("fill-opacity", "0.6");
          
          makePieChart(dataMap[id_name_map[d.id]][Object.keys(data[0])[1]],1 - dataMap[id_name_map[d.id]][Object.keys(data[0])[1]]);
          
          makeBar1Chart(dataMap[id_name_map[d.id]][Object.keys(data[0])[2]], dataMap[id_name_map[d.id]][Object.keys(data[0])[7]]);
          
          makeBar2Chart(dataMap[id_name_map[d.id]][Object.keys(data[0])[3]], dataMap[id_name_map[d.id]][Object.keys(data[0])[4]], dataMap[id_name_map[d.id]][Object.keys(data[0])[5]], dataMap[id_name_map[d.id]][Object.keys(data[0])[6]]);
          makeBar3Chart(dataMap[id_name_map[d.id]][Object.keys(data[0])[8]]);
          
          // Output state data into summary div
          $("#stateB").html(id_name_map[d.id]);
              
              var coordinates = d3.mouse(this);
              
              var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
              
              if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX + 15) + "px");
              } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
              }
          })
          .on("mouseout", function() {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            });
    
      svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("transform", "scale(" + SCALE + ")")
          .attr("d", path);
    }
    
    drawMap(config.defaultValue);
    
    option_select.on("change", function() {
      drawMap($("#selectors").find(".option-select").val());
    });
  
  
  });
  });
    
    // Dominic Nguyen's Chart
    function makePieChart(percentApart, percentOther) {
                var chart = new CanvasJS.Chart("pieChartContainer",
                {
                    title:{
                        text: "Percent in Apartments",
                        fontFamily: "Helvetica",
                        fontSize: 15,
                        fontColor: "Skyblue"
                    },     
                    animationEnabled: false,
                    backgroundColor: "#1F1F1F",
                    theme: "theme2",
                    data: [
                    {        
                        type: "doughnut",
                        startAngle: 60,                          
                        toolTipContent: "{legendText}: <strong>#percent% </strong>", 
                        indexLabelFontColor: "white",
                        indexLabelFontSize: 12,
                        showInLegend: false,
                        dataPoints: [
                            {y: percentApart, indexLabel: "Apartments #percent%", legendText: "Apartments" },
                            {y: percentOther, indexLabel: "Other #percent%", legendText: "Other" },	
                        ]
                    }
                    ]
                });
                chart.render();
            }
    
    // Joint Chart
    function makeBar1Chart(salary, housePrice) {
        var chart = new CanvasJS.Chart("bar1ChartContainer", {
            theme: "theme2",
            animationEnabled: false,
            backgroundColor: "#1F1F1F",
            axisY: {
                tickThickness: 0,
                lineThickness: 0,
                valueFormatString: " ",
                gridThickness: 0,
                minumum: 0,
                maximum: 700000
            },
            axisX: {
                tickThickness: 0,
                lineThickness: 0,
                labelFontSize: 15,
                labelFontColor: "Skyblue",
                labelFontFamily: "Helvetica"

            },
            data: [
            {
                indexLabelFontSize: 10,
                toolTipContent: "<span style='\"'color: {color};'\"'><strong>{label} </strong></span><span style='\"'font-size: 20px; color:peru '\"'><strong>'$'{y}</strong></span>",

                indexLabelPlacement: "inside",
                indexLabelFontColor: "white",
                indexLabelFontWeight: 100,
                indexLabelFontFamily: "Verdana",
                type: "column",
                dataPoints: [
                    { y: salary, label: "Median Salary", indexLabel: "$" + String(salary) },
                    { y: housePrice, label: "Median House Price", indexLabel: "$" + String(housePrice) }


                ]
            }
            ]
        });

        chart.render();
    }
    
    // Dominic Yarabe's Chart
    function makeBar2Chart(studio, oneBed, twoBed, threeBed) {
        var chart = new CanvasJS.Chart("bar2ChartContainer", {
            theme: "theme2",
            backgroundColor: "#1F1F1F",
            animationEnabled: false,
            axisY: {
                tickThickness: 0,
                lineThickness: 0,
                valueFormatString: " ",
                gridThickness: 0,
            },
            axisX: {
                tickThickness: 0,
                lineThickness: 0,
                labelFontSize: 15,
                labelFontColor: "Skyblue"

            },
            data: [
            {
                indexLabelFontSize: 10,
                toolTipContent: "<span style='\"'color: {color};'\"'><strong>{label} </strong></span><span style='\"'font-size: 20px; color:peru '\"'><strong>'$'{y}</strong></span>",

                indexLabelPlacement: "inside",
                indexLabelFontColor: "white",
                indexLabelFontWeight: 100,
                indexLabelFontFamily: "Verdana",
                type: "column",
                dataPoints: [
                    { y: studio, label: "Studio", indexLabel: "$" +  String(studio)},
                    { y: oneBed, label: "One Bedroom", indexLabel: "$" + String(oneBed) },
                    { y: twoBed, label: "Two Bedroom", indexLabel: "$" + String(twoBed) },
                    { y: threeBed, label: "Three Bedroom", indexLabel: "$" + String(threeBed) }
                ]
            }
            ]
        });

        chart.render();
    }
    
    // Christian's Chart
    function makeBar3Chart(value) {
        var chart = new CanvasJS.Chart("bar3ChartContainer", {
            title: {
                text: "Homeless per 10000",
                fontFamily: "Verdana",
                fontColor: "skyblue",
                fontSize: 18,
            },
            theme: "theme2",
            backgroundColor: "#1F1F1F",
            animationEnabled: false,
            axisY: {
                tickThickness: 0,
                lineThickness: 0,
                gridThickness: 0,
                valueFormatString: " ",
                minumum: 0,
                maximum: 45
            },
            axisX: {
                tickThickness: 0,
                lineThickness: 0,
                labelFontSize: 18,
              	gridThickness: 0,
              	valueFormatString: " ",
                labelFontColor: "white"

            },
            data: [
            {
                indexLabelFontSize: 15,
                toolTipContent: "<span style='\"'color: {color};'\"'><strong>{indexLabel}</strong></span><span style='\"'font-size: 20px; color:peru '\"'>{y}</span>",

                indexLabelPlacement: "inside",
                indexLabelFontColor: "white",
                indexLabelFontWeight: 600,
                indexLabelFontFamily: "Verdana",
                type: "bar",
                dataPoints: [
                    { y: value, label: String(value), indexLabel: "" }


                ]
            }
            ]
        });

        chart.render();
    }
});