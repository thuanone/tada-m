module.exports.command = function() {
  return this
    .setCookie({name : "cmapi_cookie_privacy", value : "permit_1|2|3"})
    .setCookie({name : "notice_gdpr_prefs", value : "0|1|2:"})
    .setCookie({name : "notice_preferences", value : "2:"})
}
