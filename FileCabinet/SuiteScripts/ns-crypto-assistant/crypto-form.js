/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define([
	'N/ui/serverWidget',
	'N/error',
	'N/url',
	'N/search',
	'./src/form-request-factory',
	'./lib/crypto-metadata',
	'./vendor/qs/qs',
], function(
	serverWidget,
	error,
	url,
	search,
	formRequestFactory,
	metadata,
	qs
) {
	return formRequestFactory(serverWidget, error, url, search, metadata, qs);
});
