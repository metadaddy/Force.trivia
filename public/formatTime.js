var timer;
var etime = 240;
function start() {
	timer = setInterval(function(){
		if (etime === 0) {
			console.log("FINISHED!");
			clearInterval(timer);
		} else {
			console.log(formatTime(etime--));
		}
	}, 1000);
}

function formatTime(d) {
	var h = d.getHours();
	if (h > 12) {
		h = h - 12;
	}
	var m = (d.getMinutes() * 60) + d.getSeconds();
	return h + ":" + getSeconds(m) + ':' + d.getMilliseconds();
}
function getSeconds(v) {
	var f = Math.floor(v / 60);
	var s = f + ":";
	var major = f == 0 ? 60 : f * 60;
	var r = major / 60;
	if (r == 0) {
		return s + "00";
	} else {
		var x = v < major ? (60 - (major - v)) : v - major;
		if (x < 10) {
			return (s + "0") + x;
		} else {
			return (s + "") + x
		}
	}
}
//start();