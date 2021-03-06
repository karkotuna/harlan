var changeCase = require("change-case");
var uniqid = require("uniqid");

module.exports = (controller) => {

    controller.registerCall("admin::remove::phone", (element, section, username, ddd, phone, pabx) => {
        element.addClass("can-remove").click((e) => {
            e.preventDefault();
            controller.call("confirm", {
                title: "Deseja realmente remover este telefone?"
            }, () => {
                controller.serverCommunication.call("DELETE FROM 'BIPBOPCOMPANYS'.'PHONE'", {
                    data: {
                        username: username,
                        ddd: ddd,
                        phone: phone,
                        pabx: pabx
                    },
                    success: (response) => {
                        controller.call("admin::viewCompany", $(response).find("BPQL > body > company"), section, "replaceWith");
                    }
                });
            });
        });
    });

    controller.registerCall("admin::remove::email", (element, section, username, email) => {
        element.addClass("can-remove").click((e) => {
            e.preventDefault();
            controller.call("confirm", {
                title: "Deseja realmente remover este email?"
            }, () => {
                controller.serverCommunication.call("DELETE FROM 'BIPBOPCOMPANYS'.'EMAIL'", {
                    data: {
                        username: username,
                        email: email
                    },
                    success: (response) => {
                        controller.call("admin::viewCompany", $(response).find("BPQL > body > company"), section, "replaceWith");
                    }
                });
            });
        });
    });

    controller.registerCall("admin::viewCompany", function(companyNode, element, method, minimized) {

        var company = $(companyNode);

        var name = company.children("nome").text(),
            username = company.children("username").text(),
            cnpj = company.children("cnpj").text(),
            cpf = company.children("cpf").text(),
            responsible = company.children("responsavel").text(),
            commercialReference = company.children("commercialReference").text(),
            credits = parseInt(company.children("credits").text());

        var [section, results, actions] = controller.call("section",
            `Administração ${name || username}`,
            `Conta registrada para documento ${cnpj || cpf || username}`,
            `Visualizar, editar e controlar`, false, minimized);

        section.addClass("admin-company");

        /* We live in citys we never seen in screen */
        var result = controller.call("result");

        if (name) result.addItem("Assinante", name);
        if (cnpj) result.addItem("CNPJ", cnpj);
        if (responsible) result.addItem("Responsável", responsible);
        if (cpf) result.addItem("CPF", cpf);
        var creditsInput = null;
        if (credits) creditsInput = result.addItem("Créditos Sistema", numeral(credits / 100.0).format('$0,0.00'));
        if (commercialReference) result.addItem("Referência Comercial", commercialReference);

        var apiKey;
        var inputApiKey = result.addItem("Chave de API", apiKey = company.children("apiKey").text());
        result.addItem("Usuário", username);
        var acceptedContract = result.addItem("Contrato Aceito", company.children("contractAccepted").text() == "true" ? "Aceito" : "Não Aceito");

        var isActive = company.children("status").text() === "1",
            activeLabel = result.addItem("Situação", isActive ? "Ativo" : "Bloqueado");

        if (!isActive) {
            section.addClass("inactive");
        }

        var phones = company.children("telefone").children("telefone");
        if (phones.length) {
            result.addSeparator("Telefones",
                "Lista de Telefones para Contato",
                "O telefone deve ser usado apenas para emergências e tratativas comerciais.");

            phones.each((idx, phoneNode) => {
                var $phoneNode = $(phoneNode);
                var [ddd, phone, pabx, contactName, kind] = [
                    $phoneNode.children("telefone:eq(0)").text(),
                    $phoneNode.children("telefone:eq(1)").text(),
                    $phoneNode.children("telefone:eq(2)").text(),
                    $phoneNode.children("telefone:eq(3)").text(),
                    $phoneNode.children("telefone:eq(4)").text()
                ];
                controller.call("admin::remove::phone", result.addItem(`${contactName} - ${kind}`, `(${ddd}) ${phone} ${pabx}`),
                    section, username, ddd, phone, pabx);
            });
        }

        var generateSeparator = (separatorCall) => {
            var separator = false;
            return (item, value) => {
                if (!value) {
                    return null;
                }

                if (!separator) {
                    separatorCall();
                    separator = true;
                }

                return result.addItem(item, value);
            };
        };

        var endereco = company.children("endereco");
        if (endereco.length) {
            var appendAddressItem = generateSeparator(() => {
                result.addSeparator("Endereço",
                    "Endereço registrado para emissão de faturas",
                    "As notas fiscais e faturas são enviadas para este endereço cadastrado, se certifique que esteja atualizado.");
            });

            appendAddressItem("Endereço", endereco.find("endereco:eq(0)").text());
            appendAddressItem("Número", endereco.find("endereco:eq(1)").text());
            appendAddressItem("Complemento", endereco.find("endereco:eq(2)").text());
            appendAddressItem("Bairro", endereco.find("endereco:eq(3)").text());
            appendAddressItem("Cidade", endereco.find("endereco:eq(4)").text());
            appendAddressItem("CEP", endereco.find("endereco:eq(5)").text());
            appendAddressItem("Estado", endereco.find("endereco:eq(6)").text());

        }
        var appendContractItem = generateSeparator(() => {
            result.addSeparator("Contrato",
                "Informações do Serviço Contratado",
                "Informações referentes ao contrato comercial estabelecido entre as partes.");
        });

        var contrato = company.children("contrato");
        appendContractItem("Dia Vencimento", contrato.find("contrato:eq(0)").text());
        appendContractItem("Valor", numeral(parseFloat(contrato.find("contrato:eq(1)").text())).format('$0,0.00'));
        appendContractItem("Pacote de Consultas", contrato.find("contrato:eq(2)").text());
        appendContractItem("Valor da Consulta Excedente", numeral(parseFloat(contrato.find("contrato:eq(3)").text())).format('$0,0.00'));
        appendContractItem("Tipo do Contrato", changeCase.titleCase(contrato.find("contrato:eq(4)").text()));
        appendContractItem("Criação", moment.unix(parseInt(contrato.find("contrato:eq(5)").text())).fromNow());

        var emails = company.children("email").children("email");
        if (emails.length) {
            result.addSeparator("Endereços de Email",
                "Endereços de e-mail registrados",
                "As notificações geradas pelo sistema são enviadas para estes e-mails.");

            emails.each(function(idx, value) {
                var email = $("email:eq(0)", value).text();
                controller.call("admin::remove::email", result.addItem($("email:eq(1)", value).text(), email),
                    section, username, email);
            });
        }

        results.append(result.element());

        if (element !== false) {
            /* element can be undefined or null, false mean it will return only */
            (element || $(".app-content"))[method || "append"](section);
        }

        var lockSymbol = $("<i />").addClass("fa").addClass(isActive ? "fa-unlock-alt" : "fa-lock"),
            lockProcess = false,
            doLocking = (e) => {
                e.preventDefault();
                if (lockProcess) {
                    return;
                }
                controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'STATUS'",
                    controller.call("error::ajax", controller.call("loader::ajax", {
                        data: {
                            account: username,
                            set: !isActive ? 1 : 0,
                        },
                        success: function() {
                            isActive = !isActive;
                            activeLabel.find(".value").text(isActive ? "Ativo" : "Bloqueado");
                            section[isActive ? "removeClass" : "addClass"]("inactive");
                            lockSymbol
                                .removeClass("fa-unlock-alt")
                                .removeClass("fa-lock")
                                .addClass(isActive ? "fa-unlock-alt" : "fa-lock");
                        }
                    })));
            };

        var showInterval = setInterval(() => {
            if (!document.contains(actions.get(0)) || !$(actions).is(':visible')) {
                return;
            }
            clearInterval(showInterval);

            controller.trigger("admin::viewCompany", {
                actions,
                companyNode,
                username,
                section
            });

            controller.call("tooltip", actions, "Editar").append($("<i />").addClass("fa fa-edit")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeCompany", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Editar Contrato").append($("<i />").addClass("fa fa-briefcase")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeContract", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Abrir Conta").append($("<i />").addClass("fa fa-folder-open")).click((e) => {
                e.preventDefault();
                window.open(`${document.location.protocol}\/\/${document.location.host}?apiKey=${encodeURIComponent(apiKey)}`);
            });

            controller.call("tooltip", actions, "Editar Endereço").append($("<i />").addClass("fa fa-map")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeAddress", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Revogar Contrato").append($("<i />").addClass("fa fa-hand-paper-o")).click((e) => {
                controller.call("confirm", {}, () => {
                    controller.serverCommunication.call("DELETE FROM 'BIPBOPCOMPANYS'.'contractAccepted'",
                        controller.call("error::ajax", controller.call("loader::ajax", {
                            data: {
                                username: username
                            },
                            success: function() {
                                acceptedContract.remove();
                            }
                        })));
                });
            });

            controller.call("tooltip", actions, "Nova Chave API").append($("<i />").addClass("fa fa-key")).click((e) => {
                controller.call("confirm", {}, () => {
                    controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'APIKEY'",
                        controller.call("error::ajax", controller.call("loader::ajax", {
                            data: {
                                username: username
                            },
                            success: function(ret) {
                                inputApiKey.find(".value").text($("BPQL > body > apiKey", ret).text());
                            }
                        })));
                });
            });

            controller.call("tooltip", actions, "Nova Senha").append($("<i />").addClass("fa fa-asterisk")).click((e) => {
                e.preventDefault();
                controller.call("admin::changePassword", username);
            });

            controller.call("tooltip", actions, "Bloquear/Desbloquear").append(lockSymbol).click(doLocking);

            controller.call("tooltip", actions, "Adicionar E-mail").append($("<i />").addClass("fa fa-at")).click((e) => {
                e.preventDefault();
                controller.call("admin::email", username, section);
            });

            controller.call("tooltip", actions, "Alterar Créditos").append($("<i />").addClass("fa fa-money")).click((e) => {
                e.preventDefault();
                let modal = controller.modal();
                modal.gamification("moneyBag");
                modal.title("Alterar Créditos");
                modal.subtitle("Alteração de Créditos do Usuário");
                modal.paragraph("Ao submeter o usuário terá de recarregar a página para verificar as mudanças em sua conta, oriente o usuário a recarregar a página.");

                let form = modal.createForm();
                var input = form.addInput("Créditos", "text", "Créditos (R$)")
                    .mask('#.##0,00', {
                        reverse: true
                    })

                if (credits) {
                    input.val(numeral(credits / 100.0).format('0,0.00'));
                }

                form.addSubmit("change-credits", "Alterar Créditos");
                form.element().submit((e) => {
                    e.preventDefault();
                    var ammount = Math.ceil(numeral().unformat(input.val()) * 100);
                    controller.server.call("UPDATE 'BIPBOPCOMPANYS'.'CREDITS'",
                        controller.call("loader::ajax", controller.call("error::ajax", {
                            data: {
                                ammount: ammount,
                                username: username
                            },
                            success: () => {
                                if (creditsInput) {
                                    creditsInput.find(".value").text(numeral(ammount / 100.0).format('$0,0.00'));
                                } else {
                                    creditsInput = result.addItem("Créditos Sistema", numeral(ammount / 100.0).format('$0,0.00')).insertAfter(inputApiKey);
                                }
                                modal.close();
                            }
                        })), true);
                });
                modal.createActions().cancel();
            });

            controller.call("tooltip", actions, "Adicionar Telefone").append($("<i />").addClass("fa fa-phone")).click((e) => {
                e.preventDefault();
                controller.call("admin::phone", username, section);
            });

            controller.call("tooltip", actions, "Consumo").append($("<i />").addClass("fa fa-tasks")).click((e) => {
                e.preventDefault();
                var unregister = $.bipbopLoader.register();
                controller.call("admin::report", (report) => {
                    report.gamification("lives");

                    $('html, body').animate({
                        scrollTop: report.element().offset().top
                    }, 2000);

                    unregister();
                }, results, username, undefined, undefined, undefined, "after", true);
            });
        }, 200);

        return section;
    });
};
