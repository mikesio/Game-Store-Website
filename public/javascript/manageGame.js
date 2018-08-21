//add event listener to each button
var stopSellingButtons = document.getElementsByClassName("notSellBtn");
for(var i = 0; i<stopSellingButtons.length;i++){
	stopSellingButtons[i].addEventListener("click", requestMysqlStopSelling);
}

var sellingButtons = document.getElementsByClassName("sellingBtn");
for(var i = 0; i<sellingButtons.length;i++){
	sellingButtons[i].addEventListener("click", requestMysqlSelling);
}


//use ajax to inform server side to update the selling status of `Games` in DB to TRUE
function requestMysqlSelling(e){

	var req = new XMLHttpRequest();

	//pack up the data that will be sent to the server
	var rowToUpdate = e.target.parentElement.parentElement;
	var row = {};
	row.id = rowToUpdate.id;	//row.id is equavilent to Games.id
	row = JSON.stringify(row);

	//get connect with the server
	req.open("POST","/sellGame",true);
	req.setRequestHeader("Content-Type", "application/json");

	//callback
	req.addEventListener("load",function(){
	if(req.status >= 200 && req.status < 400){
		//test log
		//var data = JSON.parse(req.responseText);
		//console.log(data);
		window.location.replace("/manageGame");
	} else {
	  console.log("Error in network request: " + req.statusText);
	}});

	//send the data to server
	req.send(row);

	event.preventDefault();
}

//use ajax to inform server side to update the selling status of `Games` in DB to FALSE
//also remove the game from the all customers' cart
function requestMysqlStopSelling(e){

	var req = new XMLHttpRequest();

	//pack up the data that will be sent to the server
	var rowToUpdate = e.target.parentElement.parentElement;
	var row = {};
	row.id = rowToUpdate.id;	//row.id is equavilent to Games.id
	row = JSON.stringify(row);

	//get connect with the server
	req.open("POST","/stopSellGame",true);
	req.setRequestHeader("Content-Type", "application/json");

	//callback
	req.addEventListener("load",function(){
	if(req.status >= 200 && req.status < 400){
		//test log
		var data = JSON.parse(req.responseText);
		console.log(data);
		window.location.replace("/manageGame");
	} else {
	  console.log("Error in network request: " + req.statusText);
	}});

	//send the data to server
	req.send(row);

	event.preventDefault();
}