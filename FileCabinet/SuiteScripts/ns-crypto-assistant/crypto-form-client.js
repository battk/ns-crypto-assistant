/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType ClientScript
 */
define([
	'N/url',
	'./src/form-client-factory',
	'./lib/crypto-metadata',
], function(url, formClientFactory, metadata) {
	return formClientFactory(window, url, metadata);
});
