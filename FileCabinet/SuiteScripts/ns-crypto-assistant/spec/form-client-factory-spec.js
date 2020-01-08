define([
	'../src/form-client-factory',
	'../lib/crypto-metadata',
	'./stubs/ns-module-stubs',
	'chai',
], function(formClientFactory, metadata, nsModuleStubs, chai) {
	var fieldIds = metadata.fieldIds;
	var scriptIds = metadata.scriptIds;
	var deploymentIds = metadata.deploymentIds;
	var expect = chai.expect;
	var CurrentRecordStub = nsModuleStubs.CurrentRecordStub;
	var UrlStub = nsModuleStubs.UrlStub;

	describe('form-client-factory', function() {
		describe('on fieldChanged', function() {
			var formClient = formClientFactory(null, null, metadata);

			it('copies a credential guid to the guid field', function() {
				var fields = {};
				var guidValue = 'guid';
				fields[fieldIds.credential] = guidValue;

				var currentRecord = new CurrentRecordStub(fields);
				var scriptContext = {
					currentRecord: currentRecord,
					fieldId: fieldIds.credential,
				};
				formClient.fieldChanged(scriptContext);

				expect(
					currentRecord.getValue.calledWith({ fieldId: fieldIds.credential })
				).to.be.true;
				expect(
					currentRecord.setValue.calledWith({
						fieldId: fieldIds.guid,
						value: guidValue,
					})
				).to.be.true;
			});

			it('copies a secret key guid to the guid field', function() {
				var fields = {};
				var guidValue = 'guid';
				fields[fieldIds.secretKey] = guidValue;

				var currentRecord = new CurrentRecordStub(fields);
				var scriptContext = {
					currentRecord: currentRecord,
					fieldId: fieldIds.secretKey,
				};
				formClient.fieldChanged(scriptContext);

				expect(
					currentRecord.getValue.calledWith({ fieldId: fieldIds.secretKey })
				).to.be.true;
				expect(
					currentRecord.setValue.calledWith({
						fieldId: fieldIds.guid,
						value: guidValue,
					})
				).to.be.true;
			});

			it('ignores other fields', function() {
				var fields = {};
				var guidValue = 'guid';
				fields['some_other_field'] = guidValue;

				var currentRecord = new CurrentRecordStub(fields);
				var scriptContext = {
					currentRecord: currentRecord,
					fieldId: 'some_other_field',
				};
				formClient.fieldChanged(scriptContext);

				expect(currentRecord.getValue.called).to.be.false;
				expect(currentRecord.setValue.called).to.be.false;
			});
		});

		describe('on restartCryptoAssistant', function() {
			it('redirects to the crypto assistant', function() {
				var redirectUrl = '/go/to/here';
				var url = new UrlStub(redirectUrl);
				var window = { top: { location: { href: '' } } };
				var formClient = formClientFactory(window, url, metadata);

				formClient.restartCryptoAssistant();

				expect(window.top.location.href).to.equal(redirectUrl);
				expect(
					url.resolveScript.calledWith({
						scriptId: scriptIds.cryptoAssistant,
						deploymentId: deploymentIds.cryptoAssistant,
						returnExternalUrl: false,
					})
				).to.be.true;
			});
		});
	});
});
