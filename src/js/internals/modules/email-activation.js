module.exports = function(controller) {
    controller.registerBootstrap("email-activation", (cb) => {

        if (!(controller.query.activationCode && controller.query.apiKey )) {
            cb();
            return;
        }

        controller.server.call("UPDATE 'HarlanAuthentication'.'EmailActivation'",
            controller.call("error::ajax", {
            data: {
                apiKey: controller.query.apiKey,
                activationCode: controller.query.activationCode
            },
            success: () => {
                toastr.success("Seu e-mail foi confirmado. Bons negócios usando a plataforma iCheques!", "Sua conta foi ativada com sucesso.");
            },
            complete: () => {
                cb();
            }
        }));
    });
};
