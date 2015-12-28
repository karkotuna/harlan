/*
 * Módulo de Autenticação do Harlan
 */


module.exports = function (controller) {

    /**
     * Captura o Session ID
     * @param {string} key
     * @returns {Storage|window.localStorage}
     */
    var getSessionId = function () {
        var apiKey = controller.query.apiKey;
        return apiKey ? apiKey.replace(/[^a-z0-9]/ig, "") : localStorage.sessionId;
    };

    /**
     * Define um Session ID
     * @param {string} key
     * @param {mixed} value
     * @returns {undefined}
     */
    var setSessionId = function (value) {
        if (!value) {
            delete localStorage.sessionId;
            return;
        }
        localStorage.sessionId = value;
    };

    /**
     * Registra o formulário
     */
    controller.registerBootstrap("authentication::bootstrap", function (callback) {
        callback();

        if (!authenticate()) {
            controller.interface.helpers.activeWindow(".site");
        }

        $("#action-logout").click(function (e) {
            e.preventDefault();
            controller.call("authentication::logout");
        });

        $("#form-login").submit(function (e) {
            e.preventDefault();
            controller.call("authentication::authenticate");
        });

    });


    /**
     * Chama pelo logout
     */
    controller.registerCall("authentication::logout", function () {
        controller.serverCommunication.apiKey = BIPBOP_FREE;
        controller.interface.helpers.activeWindow(".site");

        $("#input-username").val("");
        $("#input-password").val("");
        $("#input-save-password").removeAttr("checked");
        setSessionId(null);
    });

    controller.registerCall("authentication::loggedin", function () {
        controller.interface.helpers.activeWindow(".app");        
    });

    var authenticate = function (apiKey) {
        var key = apiKey || getSessionId();
        if (!key) {
            return false;
        }
        controller.serverCommunication.apiKey = key;
        controller.trigger("authentication::authenticated", null, function () {
            controller.call("authentication::loggedin");
        });

        return true;
    };

    /**
     * Força uma autenticação
     */
    controller.registerCall("authentication::force", function (args) {
        authenticate(args);
    });

    /**
     * Chama pela autenticação
     */
    controller.registerCall("authentication::authenticate", function () {

        var inputUsername = $("#input-username");
        var inputPassword = $("#input-password");
        var inputSavePassword = $("#input-save-password");

        if (/^\s*$/.test(inputUsername.val()) || inputPassword.val() === "") {
            toastr.error("Para acessar o Harlan você precisa inserir seu usuário e senha.", "Insira seu nome de usuário e senha.");
            onError();
            return;
        }

        controller.serverCommunication.call("SELECT FROM 'HarlanAuthentication'.'Authenticate'",
                controller.call("loader::ajax", controller.call("error::ajax", {
                    error: function () {
                        inputUsername.addClass("error");
                        inputPassword.addClass("error");
                    },
                    success: function (domDocument) {
                        var jDocument = $(domDocument);
                        var apiKey = jDocument.find("body apiKey").text();
                        authenticate(apiKey);

                        if (inputSavePassword.is(":checked")) {
                            setSessionId(apiKey);
                        }

                    },
                    data: {
                        username: inputUsername.val(),
                        password: inputPassword.val()
                    }
                })));
    });

};