var DB = require('./Web/db');
var JLog = require('./sub/jjlog');

DB.ready = function(Redis, Pg) {
	JLog.log("DB connected. Starting to fetch all users...");
	
	DB.users.find().on(function(users) {
		if (!users || !Array.isArray(users)) {
			JLog.error("No users found or error.");
			process.exit(1);
			return;
		}
		
		JLog.log("Fetched " + users.length + " users. Starting to update rankings...");
		var count = 0;
		
		for (var i = 0; i < users.length; i++) {
			var u = users[i];
			if (u.kkutu && typeof u.kkutu.score === 'number') {
				DB.redis.putGlobal(u._id, u.kkutu.score);
				count++;
			}
		}
		
		JLog.log("Sent update commands for " + count + " users.");
		// 레디스 명령어 전송 후 약간 대기하여 완료되도록 한 뒤 종료
		setTimeout(function() {
			JLog.log("Finished updating rankings.");
			process.exit(0);
		}, 3000);
	});
};
