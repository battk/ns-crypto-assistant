define([
	'../lib/serverWidget-util',
	'./stubs/ns-module-stubs',
	'chai',
], function(serverWidgetUtil, nsModuleStubs, chai) {
	var expect = chai.expect;
	var FieldGroupStub = nsModuleStubs.FieldGroupStub;
	var FormStub = nsModuleStubs.FormStub;
	var FieldStub = nsModuleStubs.FieldStub;
	var ServerWidgetStub = nsModuleStubs.ServerWidgetStub;
	var ButtonStub = nsModuleStubs.ButtonStub;

	describe('serverWidget-util', function() {
		describe('addFieldGroup', function() {
			it('creates a serverWidget.FieldGroup from a config object', function() {
				var fieldGroupStub = new FieldGroupStub();
				var formStub = new FormStub(fieldGroupStub);
				var config = { isSingleColumn: true, isIrrelevant: true };
				var fieldGroup = serverWidgetUtil.addFieldGroup(formStub, config);

				expect(fieldGroupStub).to.equal(fieldGroup);
				expect(formStub.addFieldGroup.calledWith(config)).to.be.true;
				expect(fieldGroup.isSingleColumn).to.equal(config.isSingleColumn);
				expect(fieldGroup.isIrrelevant).to.be.undefined;
			});
		});

		describe('addField siblings', function() {
			it('create a Secret Key Field from a config object', function() {
				var fieldStub = new FieldStub();
				var formStub = new FormStub(null, fieldStub);
				var config = {
					help: 'help value',
					isIrrelevant: true,
					height: 'only one out of 2',
					maxLength: 5,
				};
				var field = serverWidgetUtil.addSecretKeyField(formStub, config);

				expect(fieldStub).to.equal(field);
				expect(formStub.addSecretKeyField.calledWith(config)).to.be.true;
				expect(fieldStub.maxLength).to.equal(config.maxLength);
				expect(fieldStub.isIrrelevant).to.be.undefined;
				expect(fieldStub.setHelpText.called).to.be.true;
				expect(fieldStub.updateDisplaySize.called).to.be.false;
				expect(fieldStub.linkText).to.be.undefined;
			});

			it('create a Credential Field from a config object', function() {
				var fieldStub = new FieldStub();
				var formStub = new FormStub(null, fieldStub);
				var config = {
					help: 'help value',
					isIrrelevant: true,
					height: 'only one out of 2',
					maxLength: 5,
				};
				serverWidgetUtil.addCredentialField(formStub, config);

				// its honestly the same as secret key field
				expect(formStub.addCredentialField.calledWith(config)).to.be.true;
			});

			it('create a Field from a config object', function() {
				var fieldStub = new FieldStub();
				var formStub = new FormStub(null, fieldStub);
				var config = {
					help: 'help value',
					isIrrelevant: true,
					height: 'only one out of 2',
					maxLength: 5,
				};
				var field = serverWidgetUtil.addField(formStub, config);

				expect(fieldStub).to.equal(field);
				expect(formStub.addField.calledWith(config)).to.be.true;
				expect(fieldStub.maxLength).to.equal(config.maxLength);
				expect(fieldStub.isIrrelevant).to.be.undefined;
				expect(fieldStub.setHelpText.called).to.be.true;
				expect(fieldStub.updateDisplaySize.called).to.be.false;
				expect(fieldStub.linkText).to.equal(config.linkText);
			});

			it('support adding multiple select options', function() {
				var fieldStub = new FieldStub();
				var formStub = new FormStub(null, fieldStub);
				var config = {
					selectOptions: [
						{ value: 'v0', text: 't0' },
						{ value: 'v1', text: 't1', isSelected: true },
					],
				};
				serverWidgetUtil.addField(formStub, config);
				expect(fieldStub.addSelectOption.callCount).to.equal(2);
				expect(fieldStub.addSelectOption.calledWith(config.selectOptions[0])).to
					.be.true;
				expect(fieldStub.addSelectOption.calledWith(config.selectOptions[1])).to
					.be.true;
			});
		});

		describe('createPage siblings', function() {
			it('create a serverWidget.Form', function() {
				var formStub = new FormStub();
				var serverWidgetStub = new ServerWidgetStub(formStub);
				var config = {
					clientScriptModulePath: 'module path',
					isIrrelevant: true,
				};
				var form = serverWidgetUtil.createForm(serverWidgetStub, config);

				expect(formStub).to.equal(form);
				expect(serverWidgetStub.createForm.calledWith(config)).to.be.true;
				expect(formStub.clientScriptModulePath).to.equal(
					config.clientScriptModulePath
				);
				expect(formStub.isIrrelevant).to.be.undefined;
			});
		});

		describe('addButton siblings', function() {
			it('create a Reset Button', function() {
				var buttonStub = new ButtonStub();
				var formStub = new FormStub(null, null, buttonStub);
				var config = {
					isDisabled: false,
					isIrrelevant: true,
				};
				var button = serverWidgetUtil.addResetButton(formStub, config);

				expect(buttonStub).to.equal(button);
				expect(formStub.addResetButton.calledWith(config)).to.be.true;
				expect(buttonStub.isDisabled).to.equal(config.isDisabled);
				expect(formStub.isIrrelevant).to.be.undefined;
			});

			it('create a Button', function() {
				var buttonStub = new ButtonStub();
				var formStub = new FormStub(null, null, buttonStub);
				var config = {
					isDisabled: false,
					isIrrelevant: true,
				};
				var button = serverWidgetUtil.addButton(formStub, config);

				expect(buttonStub).to.equal(button);
				expect(formStub.addButton.calledWith(config)).to.be.true;
				expect(buttonStub.isDisabled).to.equal(config.isDisabled);
				expect(formStub.isIrrelevant).to.be.undefined;
			});
		});
	});
});
