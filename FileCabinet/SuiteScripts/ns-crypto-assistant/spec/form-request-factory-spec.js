define([
	'../src/form-request-factory',
	'../lib/crypto-metadata',
	'../lib/serverWidget-util',
	'./stubs/ns-module-stubs',
	'qs',
	'chai',
], function(
	formRequestFactory,
	metadata,
	serverWidgetUtil,
	nsModuleStubs,
	qs,
	chai
) {
	var expect = chai.expect;
	var ServerWidgetStub = nsModuleStubs.ServerWidgetStub;
	var FormStub = nsModuleStubs.FormStub;

	describe('form-request-factory', function() {
		describe('creates a form-request', function() {
			it('implements the suitelet entry point interface', function() {
				var formRequest = formRequestFactory();

				expect(Object.prototype.hasOwnProperty.call(formRequest, 'onRequest'))
					.to.be.true;
			});

			it('creates a form', function() {
				var formStub = new FormStub();
				var formRequest = formRequestFactory();
			});
		});
	});
});
