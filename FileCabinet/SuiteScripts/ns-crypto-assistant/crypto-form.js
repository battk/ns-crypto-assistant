/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define([
	'N/ui/serverWidget',
	'N/error',
	'N/search',
	'./src/form-request-factory',
	'./lib/crypto-metadata',
	'./lib/serverWidget-util',
	'./vendor/qs/qs',
], function(
	serverWidget,
	error,
	search,
	formRequestFactory,
	metadata,
	serverWidgetUtil,
	qs
) {
	return formRequestFactory(
		serverWidget,
		error,
		search,
		metadata,
		serverWidgetUtil,
		qs
	);
});
