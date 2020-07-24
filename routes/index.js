var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });

	// 접속자 정보
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var today = new Date();
	console.log('[' + today.toLocaleString() + '] 접속자: ' + ip);

});

router.get('/halli', function (req, res, next) {
	res.render('halli', { title: '할리갈리 테스트 페이지' });
});

module.exports = router;
