//add event listener to each gameFilterBtn button
var filterButtons = document.getElementsByClassName("gameFilterBtn");
for(var i = 0; i<filterButtons.length;i++){
	filterButtons[i].addEventListener("click", requestMysqlFilter);
}

function requestMysqlFilter(e){

  var req = new XMLHttpRequest();

  //pack up the data that will be sent to the server
  var getConsole = e.target.textContent;

  var row = {};
  row.selectedConsole = getConsole
  row = JSON.stringify(row);
  //test log
  console.log(row);
  //get connect with the server
  req.open("POST","/",true);
  req.setRequestHeader("Content-Type", "application/json");

  //callback
  req.addEventListener("load",function(){
    if(req.status >= 200 && req.status < 400){
    	//test log
		//var data = JSON.parse(req.responseText);
		//console.log(data);
		//refresh the subTotal and total 
		window.location.replace("./");
    } else {
      console.log("Error in network request: " + req.statusText);
    }});

  //send the data to server
  req.send(row);

  event.preventDefault();
}