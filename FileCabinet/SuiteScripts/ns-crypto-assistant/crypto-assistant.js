/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define([
	'N/ui/serverWidget',
	'N/error',
	'N/url',
	'N/xml',
	'./src/assistant-request-factory',
	'./lib/crypto-metadata',
], function(serverWidget, error, url, xml, assistantRequestFactory, metadata) {
	return assistantRequestFactory(serverWidget, error, url, xml, metadata);
});
