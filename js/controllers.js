(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', '$q', 'geneService', '$mdDialog', 'colorService', 'popupMenuService', 'd3', function($scope, $q, geneService, $mdDialog, colorService, popupMenuService, d3) {
			
			// Set up graph container size
			document.getElementById("graphcontainer").style.height = window.innerHeight - 200 + "px";
			
			$scope.graphSettings = {};
			$scope.graphSettings.graphwidth = document.getElementById('graphcontainer').offsetWidth - 100;
			$scope.graphSettings.maxwidth = 0;
			$scope.graphSettings.featureheight = 50;
			$scope.graphSettings.labelPosition = "middle";
			$scope.graphSettings.multilane = true;
			$scope.graphSettings.shiftgenes = false;
			$scope.graphSettings.keepgaps = false;
			$scope.graphSettings.scaleOn = true;
			$scope.graphSettings.currLane = 0;
			$scope.graphSettings.displayedFunction = "";
			$scope.graphSettings.currentFilesList = [];
			
			$scope.graphSettings.fontSizeOptions = [ "8pt", "10pt", "12pt", "14pt", "18pt", "24pt", "36pt"]
			
			$scope.graphSettings.labelPosOptions = [
				{value:'above', name:"Above"},
				{value:'middle', name:"Middle"},
				{value:'below', name:"Below"}
			]
			
			$scope.geneClipboard = {};
			
			$scope.genome = {};
			$scope.genome.oldGenome;
			$scope.genome.newGenome;
			
			$scope.tinymceOptions = {
				height: 50,
				min_height: 50,
				max_height: 200,
				elementpath: false,
				body_class: 'editor',
				content_css: 'styles/main.css',
				plugins: 'textcolor',
				menubar: false,
				toolbar1: 'undo redo | bold italic | alignleft aligncenter alignright',
				toolbar2: 'fontselect fontsizeselect | forecolor'
			};
			
			$scope.geneData = geneService.geneData;
			$scope.$on('updateGeneData', function(){
				$scope.geneData = geneService.geneData;
				$scope.genomesHash = geneService.genomesHash;
				$scope.graphSettings.maxwidth = geneService.getMaxWidth($scope.geneData);
				$scope.geneData = geneService.hideSmallGeneLabels($scope.geneData,$scope.graphSettings.maxwidth, $scope.graphSettings.graphwidth);
			});
			
			$scope.minMenuSize = 400;
			$scope.selectGene = function(index, x, y){
				if( x + $scope.minMenuSize > window.innerWidth){
					x = window.innerWidth - $scope.minMenuSize - 30;
				}
				$("#popupbox").css("left", x);
				$("#popupbox").css("top", y);
				$scope.selectedGene = parseInt(index);
				popupMenuService.updateGeneMenu(true);
				$scope.$apply();
			};
			
			$scope.selectGenome = function(index, x, y){
				$("#popupbox").css("left", x);
				$("#popupbox").css("top", y);
				$scope.selectedGene = parseInt(index);
				$scope.genome.newGenome = $scope.geneData[$scope.selectedGene]['genome'];
				$scope.genome.oldGenome = $scope.geneData[$scope.selectedGene]['genome'];
				popupMenuService.updateGenomeMenu(true);
        $scope.$apply();
			};
			
			$scope.checkForCopies = function(i){
				var i = i;
				if ($scope.genome.newGenome != $scope.genome.oldGenome){
					if ($scope.genome.newGenome in $scope.genomesHash){
						if (i == 1){
							$scope.genome.newGenome = $scope.genome.newGenome + " <!-- copy" + i +" -->";
							console.log(i + $scope.genome.newGenome);
						}
						else {
							var n = i-1;
							$scope.genome.newGenome = $scope.genome.newGenome.replace("<!-- copy" + n +" -->", "<!-- copy" + i +" -->");
							console.log(i + $scope.genome.newGenome);
						}
						$scope.checkForCopies(i+1);
					}
				}
				return;
			}
			
			function isInArray(value, array){
				return array.indexOf(value) > -1;
			}
			
			$scope.editGenomeName = function(){
				if ($scope.genome.newGenome != $scope.genome.oldGenome){
					$scope.checkForCopies(1);
					for (var i = 0; i < $scope.geneData.length; i++) {
						if (isInArray(i, $scope.genomesHash[$scope.genome.oldGenome])){
							$scope.geneData[i]['genome'] = $scope.genome.newGenome;
						}
					}
					$scope.genomesHash[$scope.genome.newGenome] = $scope.genomesHash[$scope.genome.oldGenome];
					delete $scope.genomesHash[$scope.genome.oldGenome];
				}
				$scope.genome.newGenome = $scope.geneData[$scope.selectedGene]['genome'];
				$scope.genome.oldGenome = $scope.geneData[$scope.selectedGene]['genome'];
				return;
			}
			
			$scope.globalFontFamily = function(labeltype, newfont){
				if (typeof newfont === 'undefined') { return;}
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name;
					if (labeltype === 'genomes') { change_name = $scope.geneData[i]['genome'];}
					else if (labeltype === 'genes') { change_name = $scope.geneData[i]['name'];}
					else { return; }
					var re = /font-family: [\w\s-:,"']+;/g
					var matches = change_name.match(re);
					if (matches != null){
						console.log("font-family exists");
						var newstr = "font-family: " + newfont.value + ";"
						change_name = change_name.replace(matches[0], newstr)
					}
					else {
						re = /<span style=\"font-size: \d+pt;\"/g
						var matches = change_name.match(re);
						if (matches != null){
							console.log("span exists");
							var newstr = matches[0] + " font-family: " + newfont.value + ";"
							change_name = change_name.replace(matches[0], newstr);
						}
						else {
							console.log("nothing exists");
							var newstr1 = '<span style="font-family: ' + newfont.value + ';">';
							var newstr2 = '</span>';
							change_name = change_name.replace(/<\/?span>/, '');
							change_name = newstr1 + change_name + newstr2;
						}
					}
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genome'];
						$scope.editGenomeName();
					}
					else {
						$scope.geneData[i]['name'] = change_name;
					}
				}
			}
			
			$scope.openFontSizeMenu = function($mdOpenMenu, ev){
				$mdOpenMenu(ev);
			}
			
			$scope.globalFontSize = function(labeltype, size){
				console.log(labeltype + " " + size);
			}
			
			$scope.globalAlign = function(labeltype, align){
				var labeltype = labeltype;
				if (typeof align == 'undefined') { console.log("align: " + align); return;}
				else if ( align == 'top' || align == 'middle' || align == 'bottom'){
					for (var i=0; i < $scope.geneData.length; i++){
						$scope.geneData[i]['labelvertpos'] = align;
					}
					return;
				}
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name;
					if (labeltype == 'genomes') { change_name = $scope.geneData[i]['genome'];}
					else if (labeltype == 'genes') { change_name = $scope.geneData[i]['name'];}
					else { console.log("no label type"); return; }
					var re = /text-align: [\w]+;/g
					var matches = change_name.match(re)
					if (matches != null){
						console.log("text-align exists");
						var newstr = "text-align: " + align + ";"
						change_name = change_name.replace(matches[0], newstr)
					}
					else {
						console.log("text-align does not exist");
						var newstr1 = '<p style="text-align: ' + align + ';">';
						var newstr2 = '</p>';
						change_name = change_name.replace(/<\/?p>/, '');
						change_name = newstr1 + change_name + newstr2;
					}
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genome'];
						$scope.editGenomeName();
					}
					else {
						$scope.geneData[i]['name'] = change_name;
					}
				}
			}
			
/* 			$scope.changeDisplayedFunction = function(newfunction){
				$scope.graphSettings.displayedFunction = newfunction;
				$scope.$apply();
			}; */
			
			$scope.changeGraphWidth = function(newWidth){
				$scope.graphSettings.graphwidth = parseInt(newWidth);
			};
			$scope.changeFeatureHeight = function(newHeight){
				$scope.graphSettings.featureheight = parseInt(newHeight);
			};
/* 			$scope.copyGeneAttrs = function(selectedGene){
				$scope.geneClipboard['color'] = $scope.geneData[selectedGene]['color'];
				$scope.geneClipboard['labelcolor'] = $scope.geneData[selectedGene]['labelcolor'];
			}
			$scope.pasteGeneAttrs = function(selectedGene){
				$scope.geneData[selectedGene]['color'] = $scope.geneClipboard['color'];
				$scope.geneData[selectedGene]['labelcolor'] = $scope.geneClipboard['labelcolor'];
			} */
			
			$scope.clickMultiLane = function(){
				$scope.graphSettings.shiftgenes = false;
				$scope.graphSettings.keepgaps = false;
			}
			$scope.clickShiftgenes = function(){
				$scope.graphSettings.keepgaps = false;
			}
			
			
		}])
		.controller('autoCompCtrl', function($scope, $timeout, $q, $log) {
			
			$scope.fonts        = [
				{value:"'andale mono', monospace", name:"Andale Mono"},
				{value:"arial, helvetica, sans-serif", name:"Arial"},
				{value:"'arial black', sans-serif", name:"Arial Black"},
				{value:"'book antiqua', palatino, sans-serif", name:"Book Antiqua"},
				{value:"'comic sans ms', sans-serif", name:"Comic Sans MS"},
				{value:"'courier new', courier, monospace", name:"Courier New"},
				{value:"georgia, palatino, serif", name:"Georgia"},
				{value:"helvetica, arial, sans-serif", name:"Helvetica"},
				{value:"impact, sans-serif", name:"Impact"},
				{value:"symbol", name:"Symbol"},
				{value:"tahoma, arial, helvetica, sans-serif", name:"Tahoma"},
				{value:"terminal, monaco, monospace", name:"Terminal"},
				{value:"'times new roman', Times, serif", name:"Times New Roman"},
				{value:"'trebuchet ms', geneva, sans-serif", name:"Trebuchet MS"},
				{value:"verdana, geneva, sans-serif", name:"Verdana"},
				{value:"webdings", name:"Webdings"},
				{value:"wingdings, 'zapf dingbats'", name:"Wingdings"},
			]
			
			$scope.querySearch = function querySearch (query) {
				var results = query ? $scope.fonts.filter( createFilterFor(query) ) : $scope.fonts,
						deferred;
				return results;
			}
			function createFilterFor(query) {
				var lowercaseQuery = angular.lowercase(query);

				return function filterFn(font) {
					return (font.name.toLowerCase().indexOf(lowercaseQuery) === 0);
				};
			}
		})
		.controller('tabsCtrl', [ function() {
			var self = this;
			self.tabs = [
				{title: 'Description', content:'views/description.html'},
				{title: 'Gene Graphics App', content:'views/app.html'},
				{title: 'Documentation', content:'views/doc.html'},
				{title: 'Tutorials', content:'views/tutorials.html'}
			];
		}])
		.controller('FileCtrl', ['$scope', '$http', 'geneService', 'colorService', 'popupMenuService', function($scope, $http, geneService, colorService, popupMenuService){
			$scope.data = [];
			$scope.parseTSV = function(lines){
				
					$scope.data = [];
					var header = lines[0];
					var headercols = header.split('\t');
					var headerpos = {genome:null, currLane:null, labelhidden:null, genevisible:null, genomehidden:null, genelocked:null, genomelocked:null, labelpos:null, labelvertpos:null, name:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
					$scope.maxVertOff = geneService.maxVertOff;
					for(var i = 0; i < headercols.length; i++){
						var currHeaderCol = headercols[i].toLowerCase().replace(/ /g, '');
						if (currHeaderCol === 'genome'){
							headerpos.genome = i;
						}
						else if (currHeaderCol === 'labelhidden'){
							headerpos.labelhidden = i;
						}
						else if (currHeaderCol === 'genevisible'){
							headerpos.genevisible = i;
						}
						else if (currHeaderCol === 'genomehidden'){
							headerpos.genevisible = i;
						}
						else if (currHeaderCol === 'genelocked'){
							headerpos.genelocked = i;
						}
						else if (currHeaderCol === 'genomelocked'){
							headerpos.genomelocked = i;
						}
						else if (currHeaderCol === 'labelpos'){
							headerpos.labelpos = i;
						}
						else if (currHeaderCol === 'labelvertpos'){
							headerpos.labelvertpos = i;
						}
						else if (currHeaderCol === 'name' || currHeaderCol === "genename"){
							headerpos.name = i;
						}
						else if (currHeaderCol === "function"){
							headerpos.genefunction = i;
						}
						else if (currHeaderCol === 'color' || currHeaderCol === 'genecolor'){
							headerpos.color = i;
						}
						else if (currHeaderCol === 'size' || currHeaderCol === 'size(nt)'){
							headerpos.size = i;
						}
						else if (currHeaderCol === 'start'){
							headerpos.start = i;
						}
						else if (currHeaderCol === 'stop'){
							headerpos.stop = i;
						}
						else if (currHeaderCol === 'strand'){
							headerpos.strand = i;
						}
					}
				
					var offset = {};
					var vertOff = {};
					
					for (var i = 1; i < lines.length; i++){
						
						if (lines[i].slice(0,14) === "GraphSettings:"){
							console.log("settings:");
							var newsettings = JSON.parse(lines[i].slice(14));
							for (var key in newsettings){
								if (key === 'graphwidth' || key === 'featureheight'){
									$scope.graphSettings[key] = parseFloat(newsettings[key]);
								}
								else if (key === 'labelPosition'){
									$scope.graphSettings[key] = newsettings[key];
								}
								else if (key === 'keepgaps' || key === 'multilane' || key === 'shiftgenes' || key === 'scaleOn'){
									if (newsettings[key].toLowerCase() === "true"){
										$scope.graphSettings[key] = true;
									}
									else {
										$scope.graphSettings[key] = false;
									}
								}
							}
							console.log($scope.graphSettings);
						}
						else {
							var gene = {genome:null, genomehidden:false, genelocked:false, genomelocked:false, start:null, stop:null, size:null, strand:null, name:null, genefunction:null, color:null, labelhidden:false, genevisible:true, labelvertpos:'middle', labelpos:{x:null, y:null}};
							var columns = lines[i].split('\t');
							
							var genome = columns[headerpos['genome']];
							for (var key in gene) {
								if(!offset.hasOwnProperty(genome)) {
								 vertOff[genome] = $scope.maxVertOff;
								 $scope.maxVertOff+=2;
								 offset[genome] = Math.min(parseInt(columns[headerpos['start']]), parseInt(columns[headerpos['stop']]));
								}
								if ((key === 'name' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle' || key === 'genome' || key === 'labelvertpos') && headerpos[key] !== null){
									gene[key] = columns[headerpos[key]];
								}
								if ((key === 'labelhidden' || key === 'genevisible' || key === 'genomehidden' || key === 'genelocked' || key === 'genomelocked') && headerpos[key] !== null){
									if (columns[headerpos[key]].toLowerCase() === "true"){
										gene[key] = true;
									}
									else if (columns[headerpos[key]].toLowerCase() === "false"){
										gene[key] = false;
									}
								}
								if (key === 'labelpos' && headerpos[key] !== null){
									var getpositions = columns[headerpos[key]].split(",");
									gene[key].x = parseFloat(getpositions[0]);
									gene[key].y = parseFloat(getpositions[1]);
								}
								else if((key === 'start' || key === 'stop') && headerpos[key] !== null){
									gene[key] = parseInt(columns[headerpos[key]]) - offset[genome];
								}
								else if (key === 'size' && headerpos[key] !== null){
									gene[key] = parseInt(columns[headerpos[key]]);
								}
								else if((key === 'start' || key === 'stop') && headerpos[key] === null){
									alert("Important info missing!");
								}
								else if(key === 'strand' && headerpos[key] === null){
									if (gene['start'] <= gene['stop'])
										gene[key] = '+';
									else gene[key] = '-';
								}
								else if(key === 'size' && headerpos[key] === null){
									gene[key] = Math.abs(parseInt(columns[headerpos['stop']]) - parseInt(columns[headerpos['start']]));
								}
								else if(key === 'name' && headerpos[key] === null){
									gene[key] = "Gene_" + i;
								}
								else if(key === 'genefunction' && headerpos[key] === null){
									gene[key] = ""
								}
								else if(key === 'color' && headerpos[key] === null){
									gene[key] = colorService.getHashColor(gene['genefunction']);
								}
								gene['currLane']=vertOff[genome];
							}
							$scope.data.push(gene);
						}
					}
					geneService.updateGene($scope.data, $scope.maxVertOff);
				}
				
			$scope.parseGB = function(lines) {
					$scope.data = [];
					var organism = "";
					var i = 0;
					var j;
					var k;
					$scope.maxVertOff = geneService.maxVertOff;
					while (i < lines.length) {
						var offset = "";
						if ("ORGANISM" === lines[i].slice(2,10)){
							organism = lines[i].slice(10).trim();
							console.log(organism);
						}
						else if ("FEATURES" === lines[i].slice(0,8)){
							j = i + 1;
							while (/^\s/.test(lines[j])){
								if (/^\s{5}CDS\s{13}(complement\()?\<?([\d]+)\.\.\>?([\d]+)/.test(lines[j])){
									// Get gene position
									// Incomplete genomes are not supported at this time 
									
									var positionmatch = lines[j].trim().match(/CDS\s{13}(complement\()?\<?([\d]+)\.\.\>?([\d]+)/);
									var startPos;
									var endPos;
									var strand;
									
										
									if (positionmatch[1] == "complement(") {
										strand = "-";
									} else {
										strand = "+";
									}
									if (offset === ""){
										offset = parseInt(positionmatch[2]);
									}
									startPos = parseInt(positionmatch[2]) - offset;
									endPos = parseInt(positionmatch[3] - offset);
									
									// Loop to find gene name specifics
									var genename = "";
									var protein_id = "";
									var locus_tag = "";
									var product = "";
									k = j+1
									while (/^\s{6}/g.test(lines[k])){
										if (/\/[\w|\W]*=[\w|\W]*/.test(lines[k])) {

											var matches = lines[k].trim().match(/\/([\w|\W]*)=([\w|\W]*)/);
											
											var matchval = matches[2];
											
											if(matchval.indexOf('"') != -1) {
												while(matchval.substr(matchval.length-1,1) != '"') {
													k++;
													matchval = matchval + ' ' + lines[k].trim();
												}
												matchval = matchval.substr(0, matchval.length)
											}
											
											if (matches[1] == "locus_tag"){
												locus_tag = matchval;
											}
											else if (matches[1] == "gene"){
												genename = matchval;
											}
											else if (matches[1] == "protein_id"){
												protein_id = matchval;
											}
											else if (matches[1] == "product"){
												product = matchval;
											}
										}
										
										k = k+1;
									}
									
									//name stuff
									if (product === ""){
										if (protein_id != ""){
											product = protein_id;
										} else {
											product = locus_tag;
										}
									}
									
									// Create gene item and push
									var genome = organism
									var genomestyles = [];
									
									var gene = {currLane:$scope.maxVertOff, genome:genome, genomehidden:false, genelocked:false, genomelocked:false, start:startPos, stop:endPos, size:Math.abs(startPos-endPos), strand:strand, name:genename.slice(1, genename.length-1), genefunction:product.slice(1, product.length-1), color:null, labelhidden:false, labelvertpos:'middle', genevisible:true, labelpos:{x:null, y:null}};
									
									gene["color"] = colorService.getHashColor(gene['genefunction']);
									
									$scope.data.push(gene);
									
									j = k;
								}
								j = j+1;
							}
							i = j;
						}
						i = i+1;
					}
					geneService.updateGene($scope.data, $scope.maxVertOff);
				}
				
				
			$scope.parseFile = function($fileContent, $fileType){
				$scope.content = $fileContent;
				$scope.filetype = $fileType;
				$scope.graphSettings.currentFilesList.push($fileType.input);
				var lines = $scope.content.match(/[^\r\n]+/g);
				// Create a vertical genome offset
				if ($scope.filetype[0] === 'tsv'){
					$scope.parseTSV(lines);
				}
				else if ($scope.filetype[0] === 'gb' || $scope.filetype[0] === 'gff' || $scope.filetype[0] === 'gbk'){
					$scope.parseGB(lines);
				}
				else {
					console.log("Error, not a known filetype");
				}
			}
			
			$scope.gb = {};
			$scope.gb.genbankID;
			$scope.gb.seqRange = "whole";
			$scope.gb.seqRangeStart;
			$scope.gb.seqRangeEnd;
			$scope.gb.statusMessage = "";
			$scope.gb.loadingFile = false;
			var baseURL;
			
			$scope.submitNCBIQuery = function(){
				//$scope.gb.statusMessage = "Loading file...";
				$scope.gb.loadingFile = true;
				if(!$scope.gb.genbankID){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a genbank ID.";
					return;
				}
				if ($scope.gb.seqRange == "whole") {
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&id=";
				}
				else if ($scope.gb.seqRange == "custom") {
					if(!($scope.gb.seqRangeStart < $scope.gb.seqRangeEnd)){
						$scope.gb.loadingFile = false;
						$scope.gb.statusMessage = "Please enter a valid custom range.";
						return;
					}
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&seq_start=" 
					+ $scope.gb.seqRangeStart + 
					"&seq_stop=" 
					+ $scope.gb.seqRangeEnd + 
					"&id=";
				}
				$http.get(baseURL + $scope.gb.genbankID).then(function parsePage(response) {
					$scope.gb.loadingFile = false;
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						if(lines[0].substr(0,5)!="LOCUS") {
							$scope.gb.statusMessage = "Invalid file format retrieved!";
							return;
						} 
						else if (response.data.length > 500000) {
							$scope.gb.statusMessage = "File retrieved is too large to display, please select a custom range.";
							return;
						}
						else {
							console.log(response.data.length);
							$scope.gb.statusMessage = "";
							popupMenuService.updateMenuStatus(false);
							$scope.graphSettings.currentFilesList.push("NCBI query: " + $scope.gb.genbankID);
							$scope.parseGB(lines);
						}
					}else{
						$scope.gb.statusMessage = response.statusText;
					}
				}, function errorCallback(response) {
					$scope.gb.statusMessage = response.statusText;
				});
			}
			
			$scope.tutorialFile = function(url, ftype){
				$http({
					method: 'GET',
					url: url
				}).then(function sucessCallBack(response) {
						console.log(response.data);
						var filetype = [ftype];
						filetype.input = url.split('/').pop();
						$scope.parseFile(response.data, filetype);
				}, function errorCallback(response) {
					alert(response.statusText);
				});
			};
			
			$scope.clearAllGenomes = function(){
				var ret = confirm("Do you really want to clear all data?");
				if (ret == true){
					geneService.clearGenes();
					$scope.data =[];
					$scope.graphSettings.displayedFunction = "";
					$scope.graphSettings.currentFilesList = [];
					console.log("cleared");
				}
				else {
					return;
				}
			};

		}])
		.controller('popupCtrl', ['$scope', 'popupMenuService', function($scope, popupMenuService){
			
			$scope.showPopupMenu = false;
			$scope.showGBSelect = false;
			$scope.showExportPanel = false;
			$scope.showGeneMenu = false;
			$scope.showGenomeMenu = false;
			$scope.showGraphSizeDialog = false;
			$scope.showLaneDialog = false;
			$scope.showScaleDialog = false;
			$scope.showGlobalGenome = false;
			$scope.showGlobalGene = false;
			
			$scope.$on('updateMenuStatus', function(){
				$scope.showPopupMenu = popupMenuService.MenuVisible;
				$scope.showGBSelect = popupMenuService.GBSelectVisible;
				$scope.showExportPanel = popupMenuService.ExportPanelVisible;
				$scope.showGeneMenu = popupMenuService.GeneMenuVisible;
				$scope.showGenomeMenu = popupMenuService.GenomeMenuVisible;
				$scope.showGraphSizeDialog = popupMenuService.GraphSizeDialogVisible;
				$scope.showLaneDialog = popupMenuService.LaneDialogVisible;
				$scope.showScaleDialog = popupMenuService.ScaleDialogVisible;
				$scope.showGlobalGenome = popupMenuService.GlobalGenomeVisible;
				$scope.showGlobalGene = popupMenuService.GlobalGeneVisible;
				
				if($scope.showExportPanel == true || 
						$scope.showGBSelect == true || 
						$scope.showGraphSizeDialog == true || 
						$scope.showLaneDialog == true ||
						$scope.showScaleDialog == true ||
						$scope.showGlobalGenome == true ||
						$scope.showGlobalGene == true){
						$("#popupbox").css("left", '35%');
						$("#popupbox").css("top", '200px');
				}
				return;
			});
			
			$scope.openPopup = function(menuType){
				switch(menuType) {
					case 'GBSelect':
						popupMenuService.updateGBSelect(true);
						break;
					case 'exportPanel':
						console.log("case exportPanel");
						popupMenuService.updateExportPanel(true);
						break;
					case 'geneMenu':
						popupMenuService.updateGeneMenu(true);
						break;
					case 'genomeMenu':
						popupMenuService.updateGenomeMenu(true);
						break;
					case 'graphSizeDialog':
						popupMenuService.updateGraphSizeDialog(true);
						break
					case 'laneDialog':
						popupMenuService.updateLaneDialog(true);
						break
					case 'scaleDialog':
						popupMenuService.updateScaleDialog(true);
						break
					case 'globalGenome':
						popupMenuService.updateGlobalGenome(true);
						break
					case 'globalGene':
						popupMenuService.updateGlobalGene(true);
						break
				}
				return;
			};
			
			$scope.closePopup = function(){
				popupMenuService.updateGBSelect(false);
				popupMenuService.updateExportPanel(false);
				popupMenuService.updateGeneMenu(false);
				popupMenuService.updateGenomeMenu(false);
				popupMenuService.updateGraphSizeDialog(false);
				popupMenuService.updateLaneDialog(false);
				popupMenuService.updateScaleDialog(false);
				popupMenuService.updateGlobalGenome(false);
				popupMenuService.updateGlobalGene(false);
				return;
			};
			
		}])
}());
