/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __pow = Math.pow;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/import-corp-cf-fragments.js
  var import_corp_cf_fragments_exports = {};
  __export(import_corp_cf_fragments_exports, {
    default: () => import_corp_cf_fragments_default
  });

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/data/cf-index.js
  var CONTENT_FRAGMENTS = {
    "/content/dam/stryker/content-fragments/corporate/en/contact-information/global-headquarters": { "eds": "/us/en/fragments/content-fragments/corporate/en/contact-information/global-headquarters", "fields": { "addressBlock1": "<p>1941 Stryker Way<br>\nPortage, MI 49002<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/about/contact.html">Learn More</a></p>\n', "locationName": "Global Headquarters", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Phone:</b> +1 269 385 2600<br>\n</p>\n", "BusinessHomePageLabel": "Global Headquarters Homepage" }, "title": "Global Headquarters", "uses": [{ "elementNames": ["addressBlock1", "PhoneNumbers"], "displayMode": "multi", "variationName": "master", "text": "Address 1941 Stryker Way Portage, MI 49002 USA Phone Numbers Phone: +1 269 385 2600", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/corporate-contact-information/master" }, { "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Global Headquarters Short Description Address 1941 Stryker Way Portage, MI 49002 USA Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/corporate/en/contact-information/shared-services": { "eds": "/us/en/fragments/content-fragments/corporate/en/contact-information/shared-services", "fields": { "addressBlock1": "<p>1941 Stryker Way<br>\nPortage, MI 49002<br>\nUSA</p>\n", "locationName": "Shared Services", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Phone:</b>&nbsp;+1 269 389 2300</p>\n" }, "title": "Shared Services", "uses": [{ "elementNames": ["locationName", "addressBlock1", "PhoneNumbers"], "displayMode": "multi", "variationName": "master", "text": "Location Name Shared Services Address 1941 Stryker Way Portage, MI 49002 USA Phone Numbers Phone: +1 269 389 2300", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/corporate-contact-information/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/hong-kong": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/hong-kong", "fields": { "addressBlock1": "<p>9th Floor, 12 Taikoo Wan Road,&nbsp;<br>\nTaikoo Shing, Hong Kong</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/hk/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Hong Kong (China)", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>Telephone: +852 3969 1330<br>\n<a>Fax: +852 2856 2600</a></p>\n", "BusinessHomePageLabel": "Greater China Homepage" }, "title": "Hong Kong", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Hong Kong (China) Address International Hong Kong Office 9th Floor, 12 Taikoo Wan Road, Taikoo Shing, Hong Kong Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/asean/en/contact-information/singapore-asia-pacific": { "eds": "/us/en/fragments/content-fragments/asean/en/contact-information/singapore-asia-pacific", "fields": { "addressBlock1": "<p><b>Singapore Office</b><br>\n1 GEORGE STREET&nbsp;<br>\n#20-01/02/03&nbsp;<br>\nSINGAPORE 049145</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/sg/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Singapore Asia Pacific", "AddressLabel": "Address", "BusinessHomePageLabel": "Singapore Asia Pacific Homepage" }, "title": "Singapore Asia Pacific", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Singapore Asia Pacific Address Singapore Office 51 Bras Basah Rd, Level 6, Singapore 189554 Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/medical-technology-co-ltd": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/medical-technology-co-ltd", "fields": { "addressBlock1": "<p><b>Medical Technology Co. Ltd.</b></p>\n<p>No. 18 Wuxiang, EPZ Zone A<br>\n200 Suhong Rd.<br>\nSIP, Suzhou, PRC (215021)<br>\nPeople's Republic of China (PRC)<br>\n</p>\n<p>&nbsp;</p>\n", "locationName": "China", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>86 512 8227 3388<br>\n86 512 8227 2778 Fax</p>\n" }, "title": "Medical Technology Co. Ltd.", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name China Address Medical Technology Co. Ltd. No. 18 Wuxiang, EPZ Zone A 200 Suhong Rd. SIP, Suzhou, PRC (215021) People's Republic of China (PRC) Business Home Page Phone Numbers 86 512 8227 3388 86 512 8227 2778 Fax Emails", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/trauson-medical-instrument-company-limited": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/trauson-medical-instrument-company-limited", "fields": { "addressBlock1": "<p><b>Trauson Medical Instrument Company Limited</b></p>\n<p>No.9 Longmen Road<br>\nWujin Hi-tech Industrial Zone, 213164<br>\nChangzhou City, Jiangsu Province<br>\nPeople's Republic of China (PRC)</p>\n", "EmailLabel": "Email", "locationName": "China", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>86 519 8166 5318</p>\n", "Emails": '<p><a href="mailto:hanlijun@trauson.com">hanlijun@trauson.com</a></p>\n' }, "title": "Trauson Medical Instrument Company Limited", "uses": [{ "elementNames": ["addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Address Trauson Medical Instrument Company Limited No.9 Longmen Road Wujin Hi-tech Industrial Zone, 213164 Changzhou City, Jiangsu Province People's Republic of China (PRC) Business Home Page Phone Numbers 86 519 8166 5318 Emails hanlijun@trauson.com", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>Room 917, Tower 2,<br>\nNo. 138 Wangfujing Dajie,<br>\nDongcheng district,<br>\nBeijing, China, 100006</p>\n<p>Unit 3601, HK New World Tower,<br>\nNo.300 Middle Huaihai Road,<br>\nShanghai(200020),PRC</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/cn/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Greater China", "PhoneNumbers": "<p>TEL: 021-2321 0000<br>\nFAX: 021-6391 6119<br>\nTEL: 4008107879 (Service)</p>\n", "BusinessHomePageLabel": "Greater China Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Greater China Address Room 917, Tower 2, No. 138 Wangfujing Dajie, Dongcheng district, Beijing, China, 100006 Unit 3601, HK New World Tower, No.300 Middle Huaihai Road, Shanghai(200020),PRC Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/china-limited": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/china-limited", "fields": { "addressBlock1": "Unit 3301, Hong Kong New World Tower\n300 Middle Huai Hai Road\nShanghai, Shanghai 200020\nPeople's Republic of China (PRC)", "locationName": "China Limited", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>86 21 6391 6119 Fax</p>\n<p><b>Customer support:</b><br>\n86 21 6391 6887</p>\n" }, "title": "China Limited", "uses": [{ "elementNames": ["locationName", "addressBlock1", "PhoneNumbers"], "displayMode": "multi", "variationName": "master", "text": "Location Name China Limited Address Unit 3301, Hong Kong New World Tower300 Middle Huai Hai RoadShanghai, Shanghai 200020People's Republic of China (PRC) Phone Numbers 86 21 6391 6119 Fax Customer support: 86 21 6391 6887", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/china-ltd": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/china-ltd", "fields": { "addressBlock1": "<p>9th Floor,<br>\n12 Taikoo Wan Road<br>\nTaikoo Shing, Hong Kong</p>\n", "locationName": "China Ltd", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>852 3969 1200</p>\n" }, "title": "China Ltd", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name China Ltd Address 9th Floor, 12 Taikoo Wan Road Taikoo Shing, Hong Kong Business Home Page Phone Numbers 852 3969 1200 Emails", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/far-east-inc-taiwan": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/far-east-inc-taiwan", "fields": { "addressBlock1": "<p>5F-1, NO. 100,&nbsp;Sec. 2,<br>\nRoosevelt Road,<br>\nTaipei 100, Taiwan</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/cn/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Far East Inc.", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>886 2 2367 3088<br>\n886 2 2367 3089 Fax</p>\n<p><b>Customer support</b><br>\n800 231 636</p>\n", "BusinessHomePageLabel": "Greater China Homepage" }, "title": "Far East Inc.", "uses": [{ "elementNames": ["locationName", "addressBlock1", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name Far East Inc. Address 5F-1, NO. 100, Sec. 2, Roosevelt Road, Taipei 100, Taiwan Phone Numbers 886 2 2367 3088 886 2 2367 3089 Fax Customer support 800 231 636 Emails", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/healthcare-products-co-ltd": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/healthcare-products-co-ltd", "fields": { "addressBlock1": "<p>Room 915&amp;917<br>\nOffice Beijing apm Tower 2<br>\n138 WangFuJing Da Jie, Beijing, P.R. China</p>\n", "EmailLabel": "Email", "locationName": "Healthcare Products Co., Ltd. - Beijing", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>+86 10 6526 1295<br>\n+86 10 6513 0255 Fax</p>\n<p><b>Customer support</b><br>\n800 810 7879</p>\n", "Emails": '<p><a></a><a href="mailto:vivien.li@stryker.com">vivien.li@stryker.com</a></p>\n' }, "title": "Healthcare Products Co., Ltd. ", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name Healthcare Products Co., Ltd. - Beijing Address Room 915&917 Office Beijing apm Tower 2 138 WangFuJing Da Jie, Beijing, P.R. China Business Home Page Phone Numbers +86 10 6526 1295 +86 10 6513 0255 Fax Customer support 800 810 7879 Emails vivien.li@stryker.com", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/greater-china/en/contact-information/healthcare-products-co-ltd-shanghai": { "eds": "/us/en/fragments/content-fragments/greater-china/en/contact-information/healthcare-products-co-ltd-shanghai", "fields": { "addressBlock1": "<p>36F, Hong Kong New World Tower<br>\n300 Middle Huai Hai Road<br>\nShanghai, 200021<br>\nPeople's Republic of China (PRC)</p>\n", "EmailLabel": "Email", "locationName": "Healthcare Products Co., Ltd. - Shanghai", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>86 21 2321 0000<br>\n86 21 6391 6119 Fax</p>\n<p><b>Customer support<br>\n </b>800 810 7879&nbsp;</p>\n", "Emails": '<p><a href="mailto:vivien.li@stryker.com">vivien.li@stryker.com</a></p>\n' }, "title": "Healthcare Products Co., Ltd. - Shanghai", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name Healthcare Products Co., Ltd. - Shanghai Address 36F, Hong Kong New World Tower 300 Middle Huai Hai Road Shanghai, 200021 People's Republic of China (PRC) Business Home Page Phone Numbers 86 21 2321 0000 86 21 6391 6119 Fax Customer support 800 810 7879 Emails vivien.li@stryker.com", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/india/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/india/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p><b>Stryker India Private Limited<br>\n </b>6 floor, Unit no. 0602, Block 1 - Phase 1<br>\nInternational Tech Park, Sector 59, Behrampur Village<br>\nGurgaon, Haryana, 122101</p>\n<p><b>Stryker Global Technology Center<br>\n </b>3 - 5 floor, Unit no. 0602, Block 1 - Phase 1<br>\nInternational Tech Park, Sector 59, Behrampur Village<br>\nGurgaon, Haryana, 122101</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/in/en/about/our-locations.html">Learn more</a></p>\n', "locationName": "India", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>0124 690 6669</p>\n", "BusinessHomePageLabel": "India Homepage", "Emails": '<p><a href="mailto:india@stryker.com">india@stryker.com</a></p>\n' }, "title": "India", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name India Address Stryker India Private Limited 6 floor, Unit no. 0602, Block 1 - Phase 1 International Tech Park, Sector 59, Behrampur Village Gurgaon, Haryana, 122101 Stryker Global Technology Center 3 - 5 floor, Unit no. 0602, Block 1 - Phase 1 International Tech Park, Sector 59, Behram", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/japan/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/japan/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>Shinjuku First Tower 8F/9F<br>\n5-1-1 Nishishinjuku, Shinjuku-ku<br>\n160-0023 Tokyo<br>\nJapan</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/jp/ja/about/our-locations.html">Learn More</a></p>\n', "locationName": "Japan", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p>81 3 6894 0000<br>\n81 3 6894 0000 Fax</p>\n<p><b>Customer support<br>\n </b>81 3 6894 0000<br>\n81 3 6894 0000 Fax</p>\n", "BusinessHomePageLabel": "Japan Homepage", "Emails": '<p><a href="mailto:nsk4@stryker.com">nsk4@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Japan Address Shinjuku First Tower 8F/9F 5-1-1 Nishishinjuku, Shinjuku-ku 160-0023 Tokyo Japan Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/korea/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/korea/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>6th Fl.,<br>\nASEM Tower, 517,<br>\nYeongdong-daero, Gangnam-gu,<br>\nSeoul 06164, Korea</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/kr/ko/about/our-locations.html">Learn More</a></p>\n', "locationName": "Korea", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>+82 2 565 7303<br>\n+82 2 565 4157 Fax</p>\n", "BusinessHomePageLabel": "Korea Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Korea Address 6th Fl., ASEM Tower, 517, Yeongdong-daero, Gangnam-gu, Seoul 06164, Korea Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/asean/en/contact-information/malaysia": { "eds": "/us/en/fragments/content-fragments/asean/en/contact-information/malaysia", "fields": { "addressBlock1": "<p>100.6.001 &amp; 100.6.003<br>\n129 Offices, Jaya One<br>\nPetaling Jaya, Selangor 46200 Malaysia<br>\nMalaysia</p>\n", "EmailLabel": "For any sales enquiry", "BusinessHomePage": '<p><a href="/content/stryker/my/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Malaysia", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p><a>+60 3-7661 7888</a><br>\n<a>+60 3-7661 7800 Fax</a></p>\n", "BusinessHomePageLabel": "Malaysia Homepage", "Emails": '<p><a href="mailto:strykeraseansales@stryker.com">strykeraseansales@stryker.com</a></p>\n' }, "title": "Malaysia", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Malaysia Address 100.6.001 & 100.6.003 129 Offices, Jaya One Petaling Jaya, Selangor 46200 Malaysia Malaysia Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/asean/en/contact-information/singapore": { "eds": "/us/en/fragments/content-fragments/asean/en/contact-information/singapore", "fields": { "addressBlock1": "<p>1 GEORGE STREET&nbsp;<br>\n#20-01/02/03<br>\nSingapore 049145<br>\n</p>\n", "EmailLabel": "For any sales enquiry", "BusinessHomePage": '<p><a href="/content/stryker/sg/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Singapore", "AddressLabel": "Address", "BusinessHomePageLabel": "Singapore Homepage", "Emails": '<p><a href="mailto:strykeraseansales@stryker.com">strykeraseansales@stryker.com</a></p>\n' }, "title": "Singapore", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Singapore Address 438B Alexandra Technopark Block B #06-11 Singapore 119968 Singapore Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/asean/en/contact-information/thailand": { "eds": "/us/en/fragments/content-fragments/asean/en/contact-information/thailand", "fields": { "addressBlock1": "<p>Rasa Tower II, 11th Floor<br>\n555 Phaholyothin Road<br>\nChatuchak, Bangkok 10900<br>\nThailand</p>\n", "EmailLabel": "For any sales enquiry", "BusinessHomePage": '<p><a href="/content/stryker/th/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Thailand", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><a>+66 2 937 1189</a><br>\n<a>+66 2 937 1176 Fax</a></p>\n", "BusinessHomePageLabel": "Thailand Homepage", "Emails": '<p><a href="mailto:strykeraseansales@stryker.com">strykeraseansales@stryker.com</a></p>\n' }, "title": "Thailand", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Thailand Address Rasa Tower II, 11th Floor 555 Phaholyothin Road Chatuchak, Bangkok 10900 Thailand Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---asia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/australia/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/australia/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p><b>Sydney, NSW office </b><br>\n8 Herbert Street<br>\nSt Leonards<br>\nNSW, 2065</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/au/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Australia", "PhoneNumberLabel": "Phone and fax", "PhoneNumbers": "<p>+61 2 9467 1000 Phone<br>\n+61 2 9467 1010 Fax</p>\n", "BusinessHomePageLabel": "Our Location in Australia and New Zealand" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Australia Short Description Address Sydney, NSW office 8 Herbert Street St Leonards NSW, 2065 Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---australia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/australia/en/contact-information/nz-(building-2)": { "eds": "/us/en/fragments/content-fragments/australia/en/contact-information/nz-building-2", "fields": { "addressBlock1": "<p><b>Auckland office</b><br>511 Mount Wellington Highway<br>Mount Wellington<br>Auckland 1060</p>", "locationName": "New Zealand", "AddressLabel": "Address", "PhoneNumbers": "<p><b>NZ toll free customer support<br> </b>0800 787 9287</p>" }, "title": "NZ (Building 2)", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name New Zealand Short Description Address Auckland office 511 Mount Wellington Highway Mount Wellington Auckland 1060 Business Home Page", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---australia/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/europe/en/contact-information/cork": { "eds": "/us/en/fragments/content-fragments/europe/en/contact-information/cork", "fields": { "addressBlock1": "<p><b>Stryker European Operations Limited</b><br>\nStryker Anngrove North<br>\nIDA Business &amp; Technology Park<br>\nCarrigtwohill, Co. Cork, T45 HX08</p>\n", "locationName": "Ireland", "AddressLabel": "Address" }, "title": "Cork", "uses": [{ "elementNames": ["locationName", "addressBlock1"], "displayMode": "multi", "variationName": "master", "text": "Location Name Ireland Address Stryker European Operations Limited Stryker Anngrove North IDA Business & Technology Park Carrigtwohill, Co. Cork, T45 HX08", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---europe/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/europe/en/contact-information/amsterdam": { "eds": "/us/en/fragments/content-fragments/europe/en/contact-information/amsterdam", "fields": { "addressBlock1": "<p><b>Stryker European Operations, Branch Office</b><br>\nHerikerbergweg 110<br>\n1101 CM Amsterdam<br>\nNetherlands</p>\n", "locationName": "The Netherlands", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>+31 20 2415984</p>\n" }, "title": "Amsterdam", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers", "Emails"], "displayMode": "multi", "variationName": "master", "text": "Location Name The Netherlands Address Stryker European Operations, Branch Office Herikerbergweg 110 1101 CM Amsterdam Netherlands Business Home Page Phone Numbers +31 20 2415984 Emails", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---europe/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>3365 Enterprise Ave<br>\nWeston, FL 33331<br>\nUSA</p>\n", "locationName": "Latin America", "PhoneNumbers": "<p><b>Customer support</b><br>\n954 538 8200 Phone</p>\n<p><b>Exports (Central America, Andean, and Caribbean)<br>\n </b>+57 (1) 7438215&nbsp;</p>\n" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage", "PhoneNumbers"], "displayMode": "multi", "variationName": "master", "text": "Location Name Latin America Address 3365 Enterprise Ave Weston, FL 33331 USA Business Home Page Phone Numbers Customer support 954 538 8200 Phone Exports (Central America, Andean, and Caribbean) +57 (1) 7438215", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }, { "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Latin America Address 3365 Enterprise Ave Weston, FL 33331 USA Business Home Page", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/argentina": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/argentina", "fields": { "addressBlock1": "<p>Ricardo Guti\xE9rrez 4070/90 \u2013<br>\nCP: B1605 \u2013 Munro, Partido de Vicente L\xF3pez<br>\nProvincia de Buenos Aires - Argentina.</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/ar/es/about/our-locations.html">Learn More</a></p>\n', "locationName": "Argentina", "AddressLabel": "Address", "PhoneNumbers": '<p><b>Medsurg </b>(Lunes a Viernes de 9:00 a 18:00 hs)<b>:<br>\n </b>\u{1F4DE}+54 9 11 3757-7776<br>\n<a href="mailto:Ventasms@stryker.com">Ventasms@stryker.com</a></p>\n<p><b>Medical </b>(Lunes a Viernes de 9:00 a 18:00 hs)<b>:&nbsp;&nbsp;<br>\n</b>L\xEDneas: Camas; Camillas; EMS<br>\n\u{1F4DE}+54 9 11 5885 7377<br>\n<a href="mailto:raul.ambrosio@stryker.com" title="mailto:raul.ambrosio@stryker.com">raul.ambrosio@stryker.com</a></p>\n<p><b>Neurovascular </b>(Lunes a Viernes de 9:00 a 18:00 hs)<b>:&nbsp;&nbsp;<br>\n </b>\u{1F4DE}+54 9 11 6226-3814<br>\n<a href="mailto:ordenesnv@stryker.com">ordenesnv@stryker.com</a></p>\n<p><b>Orthopaedics&nbsp;</b>(Lunes a Viernes de 9:00 a 18:00 hs)<b>:<br>\n </b>\u{1F4DE}+54 9 11 6224-2574<br>\n\u{1F4DE}+54 9 11 6226-3843<br>\n\u{1F4DE}+54 9 11-2754-9235<br>\n<a href="mailto:cotizaciones.arg@stryker.com">cotizaciones.arg@stryker.com</a></p>\n<p><b>Technical Service:<br>\n </b><a href="mailto:servicioargentina@stryker.com">servicioargentina@stryker.com</a></p>\n', "BusinessHomePageLabel": "Argentina Homepage" }, "title": "Argentina", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Argentina Address Ricardo Guti\xE9rrez 4070/90 \u2013 CP: B1605 \u2013 Munro, Partido de Vicente L\xF3pez Provincia de Buenos Aires - Argentina. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/brazil": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/brazil", "fields": { "addressBlock1": "<p>Rua Urussu\xED, 300 - 8\xBA andar<br>\nS\xE3o Paulo - SP, 04542-051, Brazil</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/br/pt/about/our-locations.html">Learn More</a></p>\n', "locationName": "Brazil", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p><b>+</b>55 11 5189-2500<br>\n</p>\n", "BusinessHomePageLabel": "Brazil Homepage", "Emails": '<p><a href="mailto:csbrasil@stryker.com">csbrasil@stryker.com</a></p>\n' }, "title": "Brazil", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Brazil Address Rua Urussu\xED, 300 - 8\xBA andar S\xE3o Paulo - SP, 04542-051, Brazil Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/chile": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/chile", "fields": { "addressBlock1": "<p>Av. Los Conquistadores 2743, Piso 3<br>\nProvidencia, Santiago, Chile</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/cl/es/about/our-locations.html">Learn More</a></p>\n', "locationName": "Chile", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p><b>+</b>56 (2) 2-751-2100<br>\n</p>\n", "BusinessHomePageLabel": "Chile Homepage" }, "title": "Chile", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Chile Address Av. Los Conquistadores 2743, Piso 3 Providencia, Santiago, Chile Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/colombia-and-puerto-rico": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/colombia-and-puerto-rico", "fields": { "addressBlock1": "<p>Calle 116 No. 7-15 Piso 10 Oficina 1001.<br>\nBogot\xE1, Colombia</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/co/es/about/our-locations.html">Learn More</a></p>\n', "locationName": "Colombia and Puerto Rico", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>+57 1 743 8200</p>\n", "BusinessHomePageLabel": "Colombia Homepage" }, "title": "Colombia and Puerto Rico", "uses": [{ "elementNames": ["locationName", "addressBlock1", ""], "displayMode": "multi", "variationName": "master", "text": "Location Name Colombia and Puerto Rico Address Calle 116 No. 7-15 Piso 10 Oficina 1001. Bogot\xE1, Colombia", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/exports-(central-america,-andean,-and-caribbean)": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/exports-central-america-andean-and-caribbean", "fields": { "addressBlock1": "<p>2555 Davie Road <br>\nDavie, FL 33317 <br>\nUSA</p>\n", "locationName": "Exports (Central America, Andean, and Caribbean)", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Customer support:</b><br>\n+57 (1) 7438215 Phone</p>\n" }, "title": "Exports (Central America, Andean, and Caribbean)", "uses": [{ "elementNames": ["locationName", "addressBlock1", "PhoneNumbers"], "displayMode": "multi", "variationName": "master", "text": "Location Name Exports (Central America, Andean, and Caribbean) Address 2555 Davie Road Davie, FL 33317 USA Phone Numbers Customer support: +57 (1) 7438215 Phone", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/latin-america/en/contact-information/mexico": { "eds": "/us/en/fragments/content-fragments/latin-america/en/contact-information/mexico", "fields": { "addressBlock1": "<p>Mariano Escobedo No. 476, Piso 4, Of. 406<br>\nCol. Nueva Anzures.<br>\nC.P. 11590.<br>\nCiudad de M\xE9xico</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/mx/es/about/our-locations.html">Learn More</a></p>\n', "locationName": "Mexico", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>+52 55 9183 0961<br>\n</p>\n", "BusinessHomePageLabel": "Mexico Homepage" }, "title": "Mexico", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Mexico Address Mariano Escobedo No. 476, Piso 4, Of. 406 Col. Nueva Anzures. C.P. 11590. Ciudad de M\xE9xico Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---latin-america/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/eemea/en/contact-information/russia": { "eds": "/us/en/fragments/content-fragments/eemea/en/contact-information/russia", "fields": { "addressBlock1": "<p>3rd floor, Business Center SkyLight, Tower \u201CB\u201D<br>\n39/80 Leningradsky Prospect<br>\nMoscow, 125167<br>\nRussia</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/ru/ru/about/our-locations.html">Learn More</a></p>\n', "locationName": "Russia", "ShortDesc": "<p><b>Covering sales for Kazakhstan and Russia.</b></p>\n", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>+7 495 785 07 74<br>\n</p>\n", "BusinessHomePageLabel": "Russia Homepage", "Emails": '<p><a href="mailto:inforussia@stryker.com">inforussia@stryker.com</a></p>\n<p><b>Technical service requests<br>\n </b><a href="mailto:service.russia@stryker.com">service.russia@stryker.com</a></p>\n' }, "title": "Russia", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Russia Short Description Covering sales for Kazakhstan and Russia. Address 3rd floor, Business Center SkyLight, Tower \u201CB\u201D 39/80 Leningradsky Prospect Moscow, 125167 Russia Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---middle-east-and-africa/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/eemea/en/contact-information/romania-and-balkans": { "eds": "/us/en/fragments/content-fragments/eemea/en/contact-information/romania-and-balkans", "fields": { "addressBlock1": "<p>7 Iuliu Maniu Boulevard<br>\nBuilding A, 2nd Floor<br>\nBucharest Romania 061072<br>\n</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/ro/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Central Eastern Europe & Romania", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>+40 21 529 91 00<br>\n+40 21 529 91 99 Fax<br>\n</p>\n", "BusinessHomePageLabel": "Romania and Balkans Homepage", "Emails": '<p><a href="mailto:stryker.romania@stryker.com">stryker.romania@stryker.com</a></p>\n' }, "title": "Romania and Balkans", "uses": [{ "elementNames": ["locationName", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Central Eastern Europe & Romania Address 7 Iuliu Maniu Boulevard Building A, 2nd Floor Bucharest Romania 061072 Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---middle-east-and-africa/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/eemea/en/contact-information/south-africa": { "eds": "/us/en/fragments/content-fragments/eemea/en/contact-information/south-africa", "fields": { "addressBlock1": "<p>Stryker Building,<br>\nWaterfall Industrial Park<br>\nCnr Pretoria Main Road &amp; Bridal Veil Rd, Midrand Johannesburg<br>\nSouth Africa</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/za/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "South Africa", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>+27 87 286 6999<br>\n+27 11 791 4644</p>\n", "BusinessHomePageLabel": "South Africa Homepage", "Emails": "<p>info.southafrica@stryker.com</p>\n" }, "title": "South Africa", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name South Africa Short Description Address Stryker Building, Waterfall Industrial Park Cnr Pretoria Main Road & Bridal Veil Rd, Midrand Johannesburg South Africa Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---middle-east-and-africa/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/eemea/en/contact-information/turkey": { "eds": "/us/en/fragments/content-fragments/eemea/en/contact-information/turkey", "fields": { "addressBlock1": "<p>Akp\u0131nar Mahallesi,<br>\nFiruze Sokak,<br>\nNo:2-6,<br>\nSancaktepe/\u0130stanbul<br>\nTurkey</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/tr/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Turkey", "PhoneNumberLabel": "Phone", "RelatedLinks": '<p>Kayseri Serbest Bolgesi&nbsp;<br>\n2. Cad. No:17&nbsp;<br>\n38070&nbsp;<br>\nKayseri/Turkiye<br>\nE-mail: <a href="mailto:infosmi@stryker.com">infosmi@stryker.com</a><br>\nPhone: +90 352 321 43 00</p>\n', "AddressLabel": "Orthopaedics, Neurosurgery, and Surgical Equipment", "PhoneNumbers": '<p>Phone:&nbsp;<a href="tel:90%20216%20693%2005%2090">90 216 693 05 90</a><br>\nFax:&nbsp;<a href="tel:90%20216%20693%2005%2091">90 216 693 05 91</a><br>\nCustomer service:&nbsp;<a href="tel:90%20216%20693%2005%2090%20Ext:2050">90 216 693 05 90 Ext:2050</a></p>\n', "RelatedLinksLabel": "Acute Care and Emergency Care ", "BusinessHomePageLabel": "Turkey Homepage", "Emails": '<p><a href="mailto:iletisim@stryker.com">iletisim@stryker.com</a></p>\n' }, "title": "Turkey", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "RelatedLinks", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Turkey Short Description Address Akp\u0131nar Mahallesi, Firuze Sokak, No:2-6, Sancaktepe/\u0130stanbul Turkey Related Links Kayseri Serbest Bolgesi 2. Cad. No:17 38070 Kayseri/Turkiye E-mail: infosmi@stryker.com Phone: +90 352 321 43 00 Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---middle-east-and-africa/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/eemea/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/eemea/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>Stryker ESCS BV - Dubai Branch<br>\nCentral Park Towers \u2013 Office Tower - Level 25 \u2013 DIFC<br>\nDubai<br>\nUnited Arab Emirates</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/ae/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Middle East", "ShortDesc": "<p><b>Covering sales for Bahrain, Iran, Israel, Jordan, Kuwait, Malta, Morocco, Oman, Qatar, Saudi Arabia, Tunisia.</b></p>\n", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>971 4 205 4222<br>\n971 4 205 4288 Fax</p>\n<p><b>Customer support</b><br>\n971 4 205 4299 Fax</p>\n", "BusinessHomePageLabel": "UAE Homepage", "Emails": "<p>info.mea@stryker.com</p>\n" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Middle East Short Description Covering sales for Bahrain, Iran, Israel, Jordan, Kuwait, Malta, Morocco, Oman, Qatar, Saudi Arabia, Tunisia. Address Stryker ESCS BV - Dubai Branch Central Park Towers \u2013 Office Tower - Level 25 \u2013 DIFC Dubai United Arab Emirates Business Home Page Learn Mo", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---middle-east-and-africa/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/canada/en/contact-information/medical-london-lp": { "eds": "/us/en/fragments/content-fragments/canada/en/contact-information/medical-london-lp", "fields": { "addressBlock1": "<p><b>Medical London LP</b></p>\n<p>1020 Adelaide St S<br>\nLondon, Ontario Canada N6E 1R6<br>\nCanada</p>\n", "locationName": "Canada", "PhoneNumberLabel": "Phone and fax", "AddressLabel": "Address", "PhoneNumbers": "<p>519 963 4010<br>\n866 516 5446 Toll Free<br>\n519 963 4013 Fax</p>\n" }, "title": "Medical London LP", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Canada Short Description Address Medical London LP 1020 Adelaide St S London, Ontario Canada N6E 1R6 Canada Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/acute-care/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/acute-care/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>3800 E. Centre Ave.<br>\nPortage, MI 49002<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/acute-care/contact.html">Learn More</a></p>\n', "locationName": "Acute Care", "ShortDesc": "<p>Stryker\u2019s Acute Care business develops innovative medical equipment focused on improving outcomes for patients and caregivers.</p>\n", "PhoneNumberLabel": "Phone and Fax", "RelatedLinks": '<p><b>ProCare Services</b><br>\nHours: M-F 8:00 am - 6:00 pm ET<br>\n800-STRYKER (787-9537)<br>\nOption 1 for Field Service<br>\nOption 2 for Tech Support<br>\nFax: 866-787-9095</p>\n<p><b>On-Site Field Service</b><br>\n<a href="mailto:medservicedesk@stryker.com">medservicedesk@stryker.com</a></p>\n', "AddressLabel": "Address", "PhoneNumbers": "<p>269 329 2100</p>\n<p><b>Customer support:<br>\n </b>800 327 0770 Toll free (USA only)<br>\n269 329 2100<br>\n800-329-7879 Fax</p>\n<p><b>Technical support:</b><br>\n800 327 0770 Toll free (USA only)<br>\n269 329 2100 Phone</p>\n", "BusinessHomePageLabel": "Acute Care Homepage", "Emails": '<p><a href="mailto:medicalcustomerservice@stryker.com">medicalcustomerservice@stryker.com</a></p>\n<p><b>Clinical team:</b><br>\n<a href="mailto:clinicalconsultants@stryker.com">clinicalconsultants@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Acute Care Short Description Stryker\u2019s Acute Care business develops innovative medical equipment focused on improving outcomes for patients and caregivers. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Acute Care Short Description Stryker\u2019s Acute Care business develops innovative medical equipment focused on improving outcomes for patients and caregivers. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/advance-guidance-technologies/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/advance-guidance-technologies/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>4100 East Milham Ave.<br>\nKalamazoo, MI 49001<br>\nUSA</p>\n", "locationName": "Advanced Guidance Technologies", "ShortDesc": "<p>We offer you a spectrum of enabling systems designed to help you optimize precision, ability, efficiency and outcomes.&nbsp;</p>\n", "PhoneNumberLabel": "Customer service", "AddressLabel": "Address", "PhoneNumbers": "<p>800 253 3210 Toll Free<br>\n269 323 7700<br>\n800 999 3811 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Advanced Guidance Technologies Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Advanced Guidance Technologies Short Description We offer you a spectrum of enabling systems designed to help you optimize precision, ability, efficiency and outcomes. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Advanced Guidance Technologies Short Description We offer you a spectrum of enabling systems designed to help you optimize precision, ability, efficiency and outcomes. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/communications/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/communications/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>571 Silveron Blvd<br>\nFlower Mound, TX 75028<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/communications/contact.html">Learn More</a></p>\n', "locationName": "Communications", "ShortDesc": "<p>We\u2019re proud to provide you with our market-leading portfolio of products and unparalleled experience to transform and optimize the many needs and demands of your patient care environments.</p>\n", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Customer support:</b><br>\n877 789 8106 Toll Free (USA only)<br>\n408 754 2969 Fax</p>\n<p><b>Technical support:<br>\n </b>866 841 5663 Toll Free (USA Only)</p>\n", "BusinessHomePageLabel": "Communications Homepage", "Emails": '<p><a href="mailto:comm_marketing@stryker.com">comm_marketing@stryker.com</a></p>\n<p><b>ProCare Services<br>\n </b><a href="mailto:CommProCareService@stryker.com">CommProCareService@stryker.com</a></p>\n<p><b>Customer support email<br>\n </b><a href="mailto:SCC-CS2@stryker.com">SCC-CS2@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Communications Short Description We\u2019re proud to provide you with our market-leading portfolio of products and unparalleled experience to transform and optimize the many needs and demands of your patient care environments. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Communications Short Description We\u2019re proud to provide you with our market-leading portfolio of products and unparalleled experience to transform and optimize the many needs and demands of your patient care environments. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/emergency-care/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/emergency-care/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>3800 E. Centre Ave.<br>\nPortage, MI 49002<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/emergency-care/contact.html">Learn More</a></p>\n', "locationName": "Emergency Care", "ShortDesc": "<p>For decades, we\u2019ve been focused on innovations that help improve patient outcomes, help prevent caregiver injuries, and increase operational efficiencies so you can do what you do best: save lives.</p>\n", "PhoneNumberLabel": "Phone and Fax", "RelatedLinks": '<p>Hours: M-F 8:00 am - 6:00 pm ET</p>\n<p>800-STRYKER (787-9537)<br>\nOption 1 for Field Service<br>\nOption 2 for Tech Support<br>\nFax: 866-787-9095</p>\n<p><b>On-Site Field Service</b><br>\n<a href="mailto:medservicedesk@stryker.com">medservicedesk@stryker.com</a></p>\n', "AddressLabel": "Address", "PhoneNumbers": '<p>269 329 2100</p>\n<p><b>Customer support</b><br>\n800 327 0770 Toll free (USA Only)<br>\n800-329-7879 Fax</p>\n<p><b>Technical support</b><br>\n800 327 0770 Toll free (USA Only)<br>\n269 329 2260 Fax</p>\n<p><b>Email</b><br>\n<a href="mailto:medicalcustomerservice@stryker.com">medicalcustomerservice@stryker.com</a></p>\n', "RelatedLinksLabel": "ProCare services", "BusinessHomePageLabel": "Emergency Care Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Emergency Care Short Description For decades, we\u2019ve been focused on innovations that help improve patient outcomes, help prevent caregiver injuries, and increase operational efficiencies so you can do what you do best: save lives. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Emergency Care Short Description For decades, we\u2019ve been focused on innovations that help improve patient outcomes, help prevent caregiver injuries, and increase operational efficiencies so you can do what you do best: save lives. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/endoscopy/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/endoscopy/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>5900 Optical Court<br>\nSan Jose, CA 95138<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/endoscopy/contact.html">Learn More</a></p>\n', "locationName": "Endoscopy", "ShortDesc": "<p>Stryker\u2019s visualization platform enables you to distinguish anatomy across all minimally invasive procedures, while providing a simple, yet personalized experience.</p>\n", "PhoneNumberLabel": "Phone and Fax", "PhoneNumbers": "<p>408 754 2000</p>\n<p><b>Customer support</b><br>\n800 624 4422 Toll Free (USA Only)<br>\n408 754 2039<br>\n800 729 2917 Toll Free (USA Only) Fax<br>\n408 754 2969 Fax</p>\n<p><b>Technical support</b><br>\n877 478 7953 Toll Free<br>\n408 754 2037</p>\n<p><b>Reimbursement Services</b><br>\n800 698 9985 (Option 1)</p>\n", "BusinessHomePageLabel": "Endoscopy Homepage", "Emails": '<p><b>Customer support</b><br>\n<a href="mailto:EndoCustomerSupport@stryker.com">EndoCustomerSupport@stryker.com</a></p>\n<p><b>Tech Support<br>\n </b><a href="mailto:endots@stryker.com">endots@stryker.com</a></p>\n<p><b>ProCare Repairs</b><br>\n<a href="mailto:EndoCSRepairteam@stryker.com">EndoCSRepairteam@stryker.com</a></p>\n<p><b>ProCare Billing</b><br>\n<a href="mailto:EndoProCareBilling@stryker.com">EndoProCareBilling@stryker.com</a></p>\n<p><b>Reimbursement Services</b><br>\n<a href="mailto:endoscopy.reimbursement@stryker.com">endoscopy.reimbursement@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Endoscopy Short Description Stryker\u2019s visualization platform enables you to distinguish anatomy across all minimally invasive procedures, while providing a simple, yet personalized experience. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Endoscopy Short Description Stryker\u2019s visualization platform enables you to distinguish anatomy across all minimally invasive procedures, while providing a simple, yet personalized experience. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/interventional-spine/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/interventional-spine/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>4100 East Milham Ave.<br>\nKalamazoo, MI 49001<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/interventional-spine/contact.html">Learn More</a></p>\n', "locationName": "Interventional Spine", "ShortDesc": "<p>Providing you with an extensive and innovative product portfolio for vertebral augmentation, vertebroplasty and radiofrequency ablation procedures, along with a diagnostic tool and decompression treatment advances for contained disc herniations.</p>\n", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Customer Service</b><br>\n800 253 3210 Toll Free<br>\n269 323 7700<br>\n800 999 3811 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Interventional Spine Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Interventional Spine Short Description Providing you with an extensive and innovative product portfolio for vertebral augmentation, vertebroplasty and radiofrequency ablation procedures, along with a diagnostic tool and decompression treatment advances for contained disc herniations. B", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Interventional Spine Short Description Providing you with an extensive and innovative product portfolio for vertebral augmentation, vertebroplasty and radiofrequency ablation procedures, along with a diagnostic tool and decompression treatment advances for contained disc herniations. B", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/joint-replacement/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/joint-replacement/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>325 Corporate Drive<br>\nMahwah, NJ 07430<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/joint-replacement/contact.html">Learn More</a></p>\n', "locationName": "Joint Replacement", "ShortDesc": "<p>Our joint replacement solutions offer you the combination of market-leading implants for hips and knees, along with Mako Robotic-Arm Assisted Technology and Performance Solutions consultative services for the orthopaedic service line.</p>\n", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>201 831 5000<br>\n201 831 6288 Fax</p>\n<p><b>Customer support</b><br>\n877 946 9678 Toll Free<br>\n866 672 7747 Toll Free OR Assist Hotline</p>\n", "BusinessHomePageLabel": "Joint Replacement Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Joint Replacement Short Description Our joint replacement solutions offer you the combination of market-leading implants for hips and knees, along with Mako Robotic-Arm Assisted Technology and Performance Solutions consultative services for the orthopaedic service line. Business Home P", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Joint Replacement Short Description Our joint replacement solutions offer you the combination of market-leading implants for hips and knees, along with Mako Robotic-Arm Assisted Technology and Performance Solutions consultative services for the orthopaedic service line. Business Home P", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/neurosurgical/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/neurosurgical/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>4100 East Milham Ave.<br>\nKalamazoo, MI 49001<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/nse/contact.html">Learn More</a></p>\n', "locationName": "Neurosurgical", "ShortDesc": "<p>We offer products for the specific needs of Neurosurgical, Spine and ENT physicians with a comprehensive suite of products developed for the precision required by these specialties.&nbsp;</p>\n", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p>800 253 3210 Toll Free<br>\n269 323 7700<br>\n800 999 3811 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Neurosurgical Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Neurosurgical Short Description We offer products for the specific needs of Neurosurgical, Spine and ENT physicians with a comprehensive suite of products developed for the precision required by these specialties. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Neurosurgical Short Description We offer products for the specific needs of Neurosurgical, Spine and ENT physicians with a comprehensive suite of products developed for the precision required by these specialties. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/neurovascular/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/neurovascular/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>47900 Bayside Parkway<br>\nFremont, California 94538-6515<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/neurovascular/contact.html">Learn More</a></p>\n', "locationName": "Neurovascular", "ShortDesc": "<p>Stryker\u2019s Neurovascular division strives to propel the field of stroke care through continuous, purposeful innovation that powers meaningful outcomes.</p>\n", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p>510 413 2500<br>\n269 488 7419 Fax</p>\n<p><b>Customer support</b><br>\n855 916 3876<br>\n855 488 8801 Fax orders</p>\n", "BusinessHomePageLabel": "Neurovascular Homepage", "Emails": '<p><a href="mailto:NVCustomerService@stryker.com">NVCustomerService@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Neurovascular Short Description Stryker\u2019s Neurovascular division strives to propel the field of stroke care through continuous, purposeful innovation that powers meaningful outcomes. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Neurovascular Short Description Stryker\u2019s Neurovascular division strives to propel the field of stroke care through continuous, purposeful innovation that powers meaningful outcomes. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/orthopaedic-instruments/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/orthopaedic-instruments/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>4100 East Milham Ave.<br>\nKalamazoo, MI 49001<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/orthopaedic-instruments/orthopaedic-instruments.html">Learn More</a></p>\n', "locationName": "Orthopaedic Instruments", "ShortDesc": "<p>Our products enable caregivers to provide a safer, simple experience for their patients.</p>\n", "PhoneNumberLabel": "Customer Service", "RelatedLinks": '<p><b>Smart equipment management</b><br>\nTo learn more, or to experience a live Smart Equipment Mangement demo, please contact your Surgical sales representative.</p>\n<p><a href="http://smartequipmentmanagement.stryker.com/">smartequipmentmanagement.stryker.com</a></p>\n', "AddressLabel": "Address", "PhoneNumbers": "<p>800 253 3210 Toll Free<br>\n269 323 7700<br>\n800 999 3811 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Orthopaedic Instruments Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Orthopaedic Instruments Short Description Our products enable caregivers to provide a safer, simple experience for their patients. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Orthopaedic Instruments Short Description Our products enable caregivers to provide a safer, simple experience for their patients. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/peripheral-vascular/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/peripheral-vascular/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>6001 Oak Canyon, Suite 100<br>\nIrvine, CA 92618</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="/content/stryker/us/en/peripheral-vascular.html">Learn More</a></p>\n', "locationName": "Peripheral Vascular", "ShortDesc": "<p>Driven by evidence and relentless passion to solve unmet needs, we're advancing peripheral vascular innovation to save and improve lives.</p>\n", "PhoneNumberLabel": "Customer Service", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Office Number</b>: 877-923-4747<br>\n<b>Fax</b>: 949-242-2535</p>\n", "BusinessHomePageLabel": "Peripheral Vascular Homepage", "Emails": '<p><a href="mailto:customerservice@inarimedical.com">customerservice@inarimedical.com</a></p>\n' }, "title": "Primary contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Peripheral Vascular Short Description Driven by evidence and relentless passion to solve unmet needs, we're advancing peripheral vascular innovation to save and improve lives. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Peripheral Vascular Short Description Driven by evidence and relentless passion to solve unmet needs, we're advancing peripheral vascular innovation to save and improve lives. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/smart-care/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/smart-care/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>3800 E. Centre Ave.<br>\nPortage, MI 49002<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="/content/stryker/us/en/smart-care/contact.html">Learn More</a></p>\n', "locationName": "Smart Care", "ShortDesc": "<p>Through our SmartHospital Platform, we're unifying clinicians, patients, data and environments to drive digital transformation at scale to meet your evolving needs. Together, we're redefining care delivery across the continuum of care.</p>\n", "AddressLabel": "Address" }, "title": "Primary contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Smart Care Short Description Through our SmartHospital Platform, we're unifying clinicians, patients, data and environments to drive digital transformation at scale to meet your evolving needs. Together, we're redefining care delivery across the continuum of care. Business Home Page Le", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Smart Care Short Description Through our SmartHospital Platform, we're unifying clinicians, patients, data and environments to drive digital transformation at scale to meet your evolving needs. Together, we're redefining care delivery across the continuum of care. Business Home Page Le", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/surgical-technologies/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/surgical-technologies/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>4100 East Milham Ave.<br>\nKalamazoo, MI 49001<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/surgical-technologies/surgical-technologies.html">Learn More</a></p>\n', "locationName": "Surgical Technologies", "ShortDesc": "<p>Through our constant innovation and customer support, we want you to be confident in your purchase decision, product performance and us as your partner.</p>\n", "PhoneNumberLabel": "Customer Service", "RelatedLinks": '<p><b>Smart equipment management</b><br>\nTo learn more, or to experience a live Smart Equipment Mangement demo, please contact your Surgical sales representative.</p>\n<p><a href="http://smartequipmentmanagement.stryker.com" target="_blank">smartequipmentmanagement.stryker.com</a></p>\n', "AddressLabel": "Address", "PhoneNumbers": "<p>800 253 3210 Toll Free<br>\n269 323 7700<br>\n800 999 3811 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Surgical Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Surgical Technologies Short Description Through our constant innovation and customer support, we want you to be confident in your purchase decision, product performance and us as your partner. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Surgical Technologies Short Description Through our constant innovation and customer support, we want you to be confident in your purchase decision, product performance and us as your partner. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/sustainability-solutions/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/sustainability-solutions/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>1810 West Drake Drive<br>\nTempe, AZ 85283<br>\nUSA</p>\n", "EmailLabel": "Florida Production Facility", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/sustainability/contact.html">Learn More</a></p>\n', "locationName": "Sustainability Solutions", "ShortDesc": "<p>We are the leading provider of reprocessing and remanufacturing services for single-use medical devices, some of the most impactful sustainability initiatives in use at US hospitals.</p>\n", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p>480 763 5300<br>\n480 763 5310 Fax</p>\n<p><b>Customer support</b><br>\n888 888 3433 Toll Free (USA Only)<br>\n888 763 8803 Product Complaint Hotline<br>\n480 809 4970 Fax</p>\n", "BusinessHomePageLabel": "Sustainability Solutions Homepage", "Emails": "<p><b><br>\n Address<br>\n </b>5307 Great Oak Drive<br>\nLakeland, FL 33815<br>\nUSA</p>\n<p><b>Phone</b><br>\n863 683 8680</p>\n" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Sustainability Solutions Short Description We are the leading provider of reprocessing and remanufacturing services for single-use medical devices, some of the most impactful sustainability initiatives in use at US hospitals. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }, { "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Sustainability Solutions Short Description We are the leading provider of reprocessing and remanufacturing services for single-use medical devices, some of the most impactful sustainability initiatives in use at US hospitals. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/canada/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/canada/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>2 Medicorum Place<br>\nWaterdown, Ontario<br>\nL8B 1W2<br>\nCanada<br>\n</p>\n", "EmailLabel": "Service", "BusinessHomePage": '<p><a href="https://www.stryker.com/ca/en/about/our-locations.html">Learn More</a></p>\n', "locationName": "Canada", "PhoneNumberLabel": "Customer service", "AddressLabel": "Address", "PhoneNumbers": '<p><b><br>\n Email:&nbsp;</b><a href="mailto:customer@stryker.ca">customer@stryker.ca</a><br>\n<b>Phone:</b>&nbsp;1-800-668-8323<br>\n<b>General inquiries (non-customer related):</b>&nbsp;<a href="mailto:info@stryker.ca">info@stryker.ca</a></p>\n', "BusinessHomePageLabel": "Canada Homepage", "Emails": '<p><a href="mailto:canadatechsupport@stryker.com">canadatechsupport@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "addressBlock1", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Canada Short Description Address 2 Medicorum Place Waterdown, Ontario L8B 1W2 Canada Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/craniomaxillofacial/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/craniomaxillofacial/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>750 Trade Centre Way, Suite 200<br>\nPortage, MI 49002<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/craniomaxillofacial/contact.html">Learn More</a></p>\n', "locationName": "Craniomaxillofacial", "ShortDesc": "<p>Through close collaboration with leading surgeons, we have a well-earned reputation as a market leader for our innovative developments in craniomaxillofacial and neurosurgery.&nbsp;</p>\n", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p>269 324 5346<br>\n</p>\n<p><b>Customer support:</b><br>\n800 962 6558 Toll Free (USA Only)<br>\n269 324 5346<br>\n877 648 7114 Fax</p>\n", "BusinessHomePageLabel": "Craniomaxillofacial Homepage", "Emails": '<p><a href="mailto:cmf-custserv@stryker.com">cmf-custserv@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Craniomaxillofacial Short Description Through close collaboration with leading surgeons, we have a well-earned reputation as a market leader for our innovative developments in craniomaxillofacial and neurosurgery. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/foot-and-ankle/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/foot-and-ankle/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>350 North Orleans St. Suite 650 S<br>\nChicago, IL 60654<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/foot-and-ankle/contact.html">Learn More</a></p>\n', "locationName": "Foot and Ankle", "ShortDesc": "<p>With our diverse array of advanced medical technologies and a comprehensive portfolio of products, we are dedicated to helping foot and ankle surgeons treat their patients more efficiently.</p>\n", "PhoneNumberLabel": "Phone", "AddressLabel": "Address", "PhoneNumbers": "<p><b>Customer support<br>\n </b>888 680 6258 Phone<br>\n855 251 9609 Toll Free Fax</p>\n", "BusinessHomePageLabel": "Foot and Ankle Homepage", "Emails": '<p><a href="mailto:fa.marketing@stryker.com">fa.marketing@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Foot and Ankle Short Description With our diverse array of advanced medical technologies and a comprehensive portfolio of products, we are dedicated to helping foot and ankle surgeons treat their patients more efficiently. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/spine/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/spine/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>600 Hope Pkwy SE<br>\nLeesburg, VA 20175<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/spine/contact.html">Learn More</a></p>\n', "locationName": "Spine", "ShortDesc": "<p>Our spine business unit offers one of the most comprehensive and diverse product portfolios, including our leading 3D-printed technologies, enabling surgeons to provide their patients with treatment options.&nbsp;</p>\n", "PhoneNumberLabel": "Phone", "RelatedLinks": '<p>To access electronic IFUs visit our <a href="https://ifu.stryker.com/">eIFU website</a>.</p>\n', "AddressLabel": "Address", "PhoneNumbers": "<p>571 919 2000</p>\n<p><b>Customer support - Allendale, NJ:</b><br>\n866 457 7463</p>\n<p><b>Customer support - Leesburg, VA:</b><br>\n571 919 2345</p>\n", "RelatedLinksLabel": "Related links", "BusinessHomePageLabel": "Spine Homepage", "Emails": '<p><b>General requests<br>\n </b><a href="mailto:SpineMarComm@stryker.com">SpineMarComm@stryker.com</a></p>\n<p><b>IFU requests<br>\n </b><a href="mailto:SpineIFURequests@stryker.com">SpineIFURequests@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Spine Short Description Our spine business unit offers one of the most comprehensive and diverse product portfolios, including our leading 3D-printed technologies, enabling surgeons to provide their patients with treatment options. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/sports-medicine/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/sports-medicine/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>5670 Greenwood Plaza Blvd, Suite 200<br>\nGreenwood Village, CO 80111<br>\nUSA</p>\n", "EmailLabel": "Email", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/sports-medicine/contact.html">Learn More</a></p>\n', "locationName": "Sports Medicine", "ShortDesc": "<p>Stryker's Sports Medicine business delivers a wide range of innovative sports medicine implants, instrumentation, resection and biologic solutions. Our solutions focus on minimally invasive and open approaches to the shoulder, knee hip and small joints.</p>\n", "PhoneNumberLabel": "Phone and Fax", "AddressLabel": "Address", "PhoneNumbers": "<p>303 993 6195 Fax</p>\n<p><b>Customer support</b><br>\n866 596 2022 - Toll free<br>\n844 220 4900 - Fax</p>\n<p><b>Technical support</b><br>\n877 478 7953 - Toll free</p>\n", "BusinessHomePageLabel": "Sports Medicine Homepage", "Emails": '<p><b>Customer support email</b><br>\n<a href="mailto:SMWest@Stryker.com">SMWest@Stryker.com</a></p>\n<p><b>Technical support email</b><br>\n<a href="mailto:EndoTS@stryker.com">EndoTS@stryker.com</a></p>\n' }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Sports Medicine Short Description Stryker's Sports Medicine business delivers a wide range of innovative sports medicine implants, instrumentation, resection and biologic solutions. Our solutions focus on minimally invasive and open approaches to the shoulder, knee hip and small joints", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" },
    "/content/dam/stryker/content-fragments/trauma-and-extremities/en/contact-information/primary-contact": { "eds": "/us/en/fragments/content-fragments/trauma-and-extremities/en/contact-information/primary-contact", "fields": { "addressBlock1": "<p>325 Corporate Drive<br>\nMahwah, NJ 07430<br>\nUSA</p>\n", "BusinessHomePage": '<p><a href="https://www.stryker.com/us/en/trauma-and-extremities/contact.html">Learn More</a></p>\n', "locationName": "Trauma & Extremities", "ShortDesc": "<p>Our trauma and extremities portfolio offers you market-leading implants for the treatment of long and small bone fractures, as well as extremity joint replacements.</p>\n", "PhoneNumberLabel": "Customer support", "AddressLabel": "Address", "PhoneNumbers": "<p>201 831 5000</p>\n", "BusinessHomePageLabel": "Trauma & Extremities Homepage" }, "title": "Primary Contact", "uses": [{ "elementNames": ["locationName", "ShortDesc", "BusinessHomePage"], "displayMode": "multi", "variationName": "master", "text": "Location Name Trauma & Extremities Short Description Our trauma and extremities portfolio offers you market-leading implants for the treatment of long and small bone fractures, as well as extremity joint replacements. Business Home Page Learn More", "xf": "/content/experience-fragments/stryker/corporate/en/contact_information/directory---us-manufacturing-business/master" }], "model": "/conf/global/settings/dam/cfm/models/contact-us-information-fragment-model" }
  };

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-richtext.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
  var KEEP_ATTRS = {
    A: ["href"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"]
  };
  function text(el) {
    return (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  var squash = (value) => value.replace(/[\s\u00a0]+/g, "");
  function rename(el, tagName) {
    const doc = el.ownerDocument;
    const next = doc.createElement(tagName);
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function unwrap(el) {
    el.replaceWith(...el.childNodes);
  }
  function absoluteAsset(href) {
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN}${href}` : href;
  }
  function newTabHref(source, href) {
    if (!href || href.startsWith("#") || href.endsWith("#_blank") || /^(mailto|tel):/i.test(href)) return href;
    const isPdf = /\.pdf(\?|$)/i.test(href);
    const newTab = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || newTab ? `${href}#_blank` : href;
  }
  var SIZE_STEPS = [[0.8, "p-0-8"], [1, ""], [1.25, "p-1-25"], [1.5, "p-1-5"], [1.75, "p-1-75"], [2, "p-2"], [2.5, "p-2-5"]];
  var FONT_STYLES = [
    ["urw-egyptienne", "serif"]
  ];
  function sizeFactor(cls) {
    const m = cls.match(/^fontsize-(\d+)(?:-(\d+))?em$/);
    if (!m) return 1;
    if (!m[2] && Number(m[1]) > 4) return Number(m[1]) / 10;
    return Number(`${m[1]}.${m[2] || 0}`);
  }
  function sizeStyle(factor) {
    const [[style]] = SIZE_STEPS.map(([f, s]) => [s, Math.abs(Math.log(factor / f))]).sort((a, b) => a[1] - b[1]);
    return style;
  }
  function effectiveSize(el) {
    const sizes = /* @__PURE__ */ new Set();
    const copySizes = /* @__PURE__ */ new Set();
    const labelSizes = /* @__PURE__ */ new Set();
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (squash(n.textContent)) {
        let factor = 1;
        for (let e = n.parentElement; e && e !== el.parentElement; e = e.parentElement) {
          factor = [...e.classList].reduce((f, c) => f * sizeFactor(c), factor);
        }
        const size = Math.round(factor * 100) / 100;
        sizes.add(size);
        const label = n.parentElement.closest(".futura-bold, b, strong");
        if (!label || !el.contains(label) || label === el) copySizes.add(size);
        else labelSizes.add(size);
      }
    }
    const counted = copySizes.size ? copySizes : sizes;
    if (counted.size !== 1) return null;
    const [copy] = counted;
    if (copy > 1 && [...labelSizes].some((s) => s > copy)) return null;
    return copy;
  }
  function coveredBy(el, cls) {
    const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
    return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
  }
  function copyStyles(root) {
    const candidates = root.matches && root.matches("p, li") ? [root] : [...root.querySelectorAll("p, li")];
    const copy = candidates.filter((el) => text(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const sizes = new Set(copy.map(effectiveSize));
    const size = sizes.size === 1 && !sizes.has(null) ? sizeStyle([...sizes][0]) : "";
    const font = FONT_STYLES.find(([cls]) => copy.every((el) => coveredBy(el, cls)));
    return [size, font && font[1]].filter(Boolean).join(", ");
  }
  function sameLineText(node, direction) {
    let value = "";
    let sibling = node[direction];
    while (sibling && sibling.nodeName !== "BR") {
      value += sibling.textContent;
      sibling = sibling[direction];
    }
    return squash(value);
  }
  var COLOURS = {
    ffb500: "color-gold",
    "1c5687": "color-blue",
    "85458a": "color-purple",
    "4c7d7a": "color-teal",
    "27455c": "color-navy",
    545857: "color-grey",
    ffffff: "color-white",
    // corp-only (styles-corp.css): the light grey surface (613 uses, e.g. orthopaedic "In my
    // practice…", "CONTACT US" links), silver (107) and dark gold (58)
    edeeec: "color-light-gray",
    // the darker grey (#dfe1de, the bg-gray surface; 55 uses on 19 pages, west-point "in the
    // game") — was taken for light grey
    dfe1de: "color-gray",
    b2b4ae: "color-silver",
    af6d04: "color-dark-gold"
  };
  var NEUTRAL = /* @__PURE__ */ new Set(["color-white", "color-light-gray", "color-gray", "color-silver", "color-grey", ""]);
  function toHex(value) {
    const v = (value || "").trim().toLowerCase();
    if (v === "white") return "ffffff";
    if (v === "black") return "000000";
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) return m[1].split("").map((c) => c + c).join("");
    m = v.match(/^#([0-9a-f]{6})$/);
    if (m) return m[1];
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    return "";
  }
  function lab(hex) {
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v > 0.04045 ? __pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    });
    const t = (v) => v > 8856e-6 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    const x = t((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
    const y = t(r * 0.2126 + g * 0.7152 + b * 0.0722);
    const z = t((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function colourClass(hex) {
    if (!hex) return "";
    if (COLOURS[hex] !== void 0) return COLOURS[hex];
    const target = lab(hex);
    const neutral = Math.abs(target[1]) < 3 && Math.abs(target[2]) < 6;
    const [[best]] = [...Object.entries(COLOURS), ["000000", ""]].filter(([, cls]) => !neutral || NEUTRAL.has(cls)).map(([h, cls]) => [cls, Math.hypot(...lab(h).map((v, i) => v - target[i]))]).sort((a, b) => a[1] - b[1]);
    return best;
  }
  function inlineColour(el) {
    if (el.tagName === "FONT" && el.getAttribute("color")) return toHex(el.getAttribute("color"));
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? toHex(m[1]) : "";
  }
  function wrapInTag(first, last, cls) {
    const doc = first.ownerDocument;
    if (first.nodeType === 3) {
      const lead = first.textContent.match(/^\s*/)[0];
      if (lead) {
        first.before(doc.createTextNode(lead));
        first.textContent = first.textContent.slice(lead.length);
      }
    }
    if (last.nodeType === 3) {
      const tail = last.textContent.match(/\s*$/)[0];
      if (tail) {
        last.after(doc.createTextNode(tail));
        last.textContent = last.textContent.slice(0, last.textContent.length - tail.length);
      }
    }
    first.before(doc.createTextNode(`[[${cls}]`));
    last.after(doc.createTextNode("]"));
  }
  function mapColours(root) {
    const coloured = [...root.querySelectorAll('[style*="color"], font[color]')].filter((el) => inlineColour(el));
    const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
    const freeText = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1 || own.get(node)) return "";
      return [...node.childNodes].map(freeText).join("");
    };
    const linkOnly = (el) => !!el.closest("a[href]") || [...el.querySelectorAll("a[href]")].some((a) => squash(a.textContent) === squash(el.textContent));
    coloured.forEach((el) => {
      const cls = colourClass(own.get(el)) || (own.get(el) === "000000" && linkOnly(el) ? "color-black" : "");
      if (!cls) return;
      if (cls === "color-teal" && linkOnly(el)) return;
      const around = !el.closest("a[href]") && linkOnly(el);
      if (around && cls !== "color-black") return;
      const hasOwn = (node) => node.nodeType === 1 && [...node.querySelectorAll("*")].some((d) => own.get(d));
      const skipLinks = !el.closest("a[href]") && cls !== "color-black";
      const holdsLink = (node) => skipLinks && node.nodeType === 1 && (node.matches("a[href]") || !!node.querySelector("a[href]"));
      const wrapFree = (parent) => {
        let run = [];
        const blank2 = (n) => !squash(freeText(n)) && !(n.nodeType === 1 && n.querySelector("img"));
        const flush = () => {
          while (run.length && blank2(run[0])) run.shift();
          while (run.length && blank2(run[run.length - 1])) run.pop();
          if (run.length) wrapInTag(run[0], run[run.length - 1], cls);
          run = [];
        };
        [...parent.childNodes].forEach((child) => {
          if (child.nodeType === 1 && own.get(child)) flush();
          else if (holdsLink(child)) {
            flush();
            if (!child.matches("a[href]")) wrapFree(child);
          } else if (hasOwn(child)) {
            flush();
            wrapFree(child);
          } else run.push(child);
        });
        flush();
      };
      wrapFree(el);
    });
  }
  function tagPlainBoldLabels(root, wholeParagraphs) {
    const doc = root.ownerDocument;
    [...root.querySelectorAll("b")].forEach((b) => {
      if (b.closest(".futura-bold") || b.querySelector(".futura-bold") || b.parentElement.closest("b")) return;
      if (b.closest(".standalone-link") || b.querySelector(".standalone-link")) return;
      if (!text(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6") || (wholeParagraphs && root.contains(b) ? root : null);
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && block.tagName === "P" && text(block) === text(b)) return;
      b.before(doc.createTextNode("[[body-font]"));
      b.after(doc.createTextNode("]"));
    });
  }
  function cleanRichText(root, { wholeParagraphs = false, divParagraphs = true } = {}) {
    const control = (ch) => {
      const code = ch.charCodeAt(0);
      return code < 32 && ![9, 10, 13].includes(code) || code === 127;
    };
    const ctrlWalker = root.ownerDocument.createTreeWalker(root, 4);
    for (let n = ctrlWalker.nextNode(); n; n = ctrlWalker.nextNode()) {
      if ([...n.textContent].some(control)) n.textContent = [...n.textContent].filter((ch) => !control(ch)).join("");
    }
    if (divParagraphs) {
      [...root.querySelectorAll("div")].reverse().forEach((div) => {
        if (text(div) && !div.querySelector("p, div, ul, ol, h1, h2, h3, h4, h5, h6, table")) rename(div, "p");
      });
    }
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (!h.classList.contains("border-bottom-gold") || h.querySelector("u") || !text(h)) return;
      const u = root.ownerDocument.createElement("u");
      while (h.firstChild) u.append(h.firstChild);
      h.append(u);
    });
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text(el));
    const centred = blocks.length > 0 && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute("style") || ""));
    const size = copyStyles(root);
    const doc = root.ownerDocument;
    blocks.filter((el) => el.tagName !== "LI" && !/^\[\[blank line\]\]$/i.test(text(el))).forEach((el) => {
      const style = el.getAttribute("style") || "";
      const align = (style.match(/text-align:\s*(center|right)/i) || [])[1];
      const indent = Number((style.match(/margin-left:\s*(\d+)px/i) || [])[1] || 0);
      const tags = [
        align && !(centred && /center/i.test(align)) ? `align-${align.toLowerCase()}` : "",
        indent > 0 ? "indent" : ""
      ].filter(Boolean);
      if (!tags.length) return;
      el.prepend(doc.createTextNode(`[[${tags.join(",")}]`));
      el.append(doc.createTextNode("]"));
    });
    const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== "BR" && !node.textContent.trim() && !node.querySelector("img, br");
    [...root.querySelectorAll("span, b, i, em, strong")].reverse().forEach((el) => {
      let last = el.lastChild;
      while (last && (last.nodeName === "BR" || emptyElement(last) || last.nodeType === 3 && !last.textContent.trim())) {
        if (emptyElement(last)) {
          const next = el.nextSibling;
          if (/[\s\u00a0]/.test(last.textContent) && !(next && /^[\s\u00a0]/.test(next.textContent))) {
            el.after(doc.createTextNode(" "));
          }
          last.remove();
        } else el.after(last);
        last = el.lastChild;
      }
      if (last && last.nodeType === 3 && /[\s\u00a0]$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/[\s\u00a0]+$/, "");
        el.after(doc.createTextNode(" "));
      }
    });
    tagPlainBoldLabels(root, wholeParagraphs);
    const standalone = /* @__PURE__ */ new Set();
    root.querySelectorAll(".standalone-link").forEach((span) => {
      const own = span.closest("a");
      (own ? [own] : [...span.querySelectorAll("a[href]")]).forEach((a) => {
        let wrapper = a.parentElement;
        while (wrapper && wrapper !== span && wrapper.tagName === "SPAN" && squash(wrapper.textContent) === squash(a.textContent)) {
          unwrap(wrapper);
          wrapper = a.parentElement;
        }
        standalone.add(a);
      });
    });
    const triangle = /[\s\u00a0]*[\u25ba\u25b6\u25b8][\s\u00a0]*$/;
    root.querySelectorAll("a[href]").forEach((a) => {
      if (!triangle.test(a.textContent)) return;
      if (!(a.closest(".futura-bold") || a.querySelector(".futura-bold"))) return;
      const walker = doc.createTreeWalker(a, 4);
      let lastText = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) lastText = n;
      }
      if (lastText) lastText.textContent = lastText.textContent.replace(triangle, "");
      let span = a.parentElement;
      while (span && span.tagName === "SPAN" && squash(span.textContent) === squash(a.textContent)) {
        unwrap(span);
        span = a.parentElement;
      }
      a.querySelectorAll("span").forEach((s) => {
        if (!inlineColour(s)) unwrap(s);
      });
      standalone.add(a);
    });
    standalone.forEach((a) => {
      const u = doc.createElement("u");
      while (a.firstChild) u.append(a.firstChild);
      a.append(u);
      const strong = doc.createElement("strong");
      a.replaceWith(strong);
      strong.append(a);
    });
    const futuraText = (el) => {
      const walker = doc.createTreeWalker(el, 4);
      let all = true;
      let any = false;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) {
          any = true;
          if (!n.parentElement.closest(".futura-bold")) all = false;
        }
      }
      return any && all;
    };
    const boldLinks = [...root.querySelectorAll("a[href]")].filter((a) => {
      const line = a.closest("p, li");
      if (standalone.has(a) || !line || a.querySelector("img")) return false;
      if (squash(line.textContent) !== squash(a.textContent) || !futuraText(a)) return false;
      a.querySelectorAll("span.futura-bold").forEach(unwrap);
      [...line.querySelectorAll("span.futura-bold")].filter((span) => span.contains(a)).forEach(unwrap);
      return true;
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => {
      const walker = doc.createTreeWalker(el, 4);
      let serif = false;
      let futura = false;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) {
          const font = n.parentElement.closest(".urw-egyptienne, .futura-bold");
          if (font && font !== el && el.contains(font) && font.classList.contains("urw-egyptienne")) serif = true;
          else futura = true;
        }
      }
      if (serif && !futura) el.dataset.serifInside = "1";
    });
    mapColours(root);
    boldLinks.forEach((a) => {
      a.prepend(doc.createTextNode("[[futura-bold]"));
      a.append(doc.createTextNode("]"));
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => {
      if (!el.closest("p, li") || el.closest("h1, h2, h3, h4, h5, h6") || el.dataset.serifInside) {
        rename(el, "strong");
        return;
      }
      const strong = rename(el, "strong");
      const em = root.ownerDocument.createElement("em");
      while (strong.firstChild) em.append(strong.firstChild);
      strong.append(em);
    });
    root.querySelectorAll("b").forEach((el) => rename(el, "strong"));
    root.querySelectorAll("i").forEach((el) => rename(el, "em"));
    root.querySelectorAll("span, font").forEach(unwrap);
    root.querySelectorAll("strong strong, em em").forEach(unwrap);
    root.querySelectorAll("strong, em").forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector("img, br")) el.remove();
    });
    root.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("href", newTabHref(a, absoluteAsset(a.getAttribute("href"))));
    });
    root.querySelectorAll("*").forEach((el) => {
      const keep = KEEP_ATTRS[el.tagName] || [];
      [...el.attributes].forEach((attr) => {
        if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
      });
    });
    root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach((el) => {
      while (el.lastChild && (el.lastChild.nodeName === "BR" || el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim())) {
        el.lastChild.remove();
      }
      if (!text(el) && !el.querySelector("img")) el.remove();
    });
    return { centred, size };
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-components.js
  function corpLinkHref(href) {
    const value = String(href || "").trim();
    if (!value || /^(mailto|tel):|^#/i.test(value)) return value;
    const m = value.match(/^(?:https?:\/\/www\.stryker\.com)?(\/[^?#]*)([?#].*)?$/i);
    if (!m) return value;
    const path = m[1].replace(/^\/content\/stryker(?=\/)/, "");
    const rest = m[2] || "";
    if (/^\/us\/en(\/|$)/.test(path) && !path.startsWith("/content/")) {
      const eds = path.replace(/\.html?$/, "").replace(/\/index$/, "/");
      return `${eds || "/"}${rest}`;
    }
    return `https://www.stryker.com${path}${rest}`;
  }
  var CF_FIELDS = ["locationName", "ShortDesc", "addressBlock1", "PhoneNumbers", "Emails", "RelatedLinks", "BusinessHomePage"];
  function fieldNodes(doc, html) {
    const parsed = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html").body.firstElementChild;
    const box = doc.importNode(parsed, true);
    if (![...box.children].some((el) => /^(P|UL|OL|DIV|H[1-6])$/.test(el.tagName)) && text(box)) {
      const p = doc.createElement("p");
      p.append(...box.childNodes);
      box.append(p);
    }
    box.querySelectorAll("a").forEach((a) => {
      if (!(a.getAttribute("href") || "").trim()) a.replaceWith(...a.childNodes);
    });
    cleanRichText(box);
    box.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", corpLinkHref(a.getAttribute("href"))));
    return [...box.children].filter((el) => text(el) || el.querySelector("img"));
  }
  function contentFragmentBlocks(doc, info, rendered) {
    const shown = new Set(info.uses.flatMap((u) => u.elementNames || []));
    const wrapper = rendered && rendered.closest(".contentfragment");
    const level = (wrapper && wrapper.className.match(/\btitle_h([1-6])\b/) || [])[1] || "4";
    const renderedValue = (field) => {
      const dd = rendered && rendered.querySelector(`.cmp-contentfragment__element--${field} .cmp-contentfragment__element-value`);
      return dd ? dd.innerHTML : null;
    };
    const cell = [];
    CF_FIELDS.filter((field) => shown.has(field)).forEach((field) => {
      var _a;
      const html = (_a = renderedValue(field)) != null ? _a : info.fields[field];
      if (field === "locationName") {
        const value = text(fieldNodes(doc, html)[0] || doc.createElement("p"));
        if (!value) return;
        const h = doc.createElement(`h${level}`);
        h.textContent = value;
        cell.push(h);
        return;
      }
      const nodes = fieldNodes(doc, html);
      if (field === "BusinessHomePage") {
        nodes.forEach((node) => node.querySelectorAll("a[href]").forEach((a) => {
          if (a.closest("strong")) return;
          const u = doc.createElement("u");
          u.append(...a.childNodes);
          a.append(u);
          const strong = doc.createElement("strong");
          a.replaceWith(strong);
          strong.append(a);
        }));
      }
      cell.push(...nodes);
    });
    const blocks = [WebImporter.Blocks.createBlock(doc, { name: "Cards (contact)", cells: [[cell]] })];
    const rows = Object.entries(info.fields).filter(([field, value]) => (field.endsWith("Label") || !shown.has(field)) && String(value || "").replace(/<[^>]+>/g, "").trim()).map(([field, value]) => [field, field.endsWith("Label") ? String(value).trim() : fieldNodes(doc, value)]);
    if (rows.length) blocks.push(WebImporter.Blocks.createBlock(doc, { name: "Metadata", cells: rows }));
    return blocks;
  }

  // ../../../../tmp/run-outputs/lib-wt/scripts/span-tags.js
  var toClassName = (name) => typeof name === "string" ? name.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") : "";
  var INLINE_TAGS = /* @__PURE__ */ new Set(["A", "B", "BR", "DEL", "EM", "I", "S", "SPAN", "STRONG", "SUB", "SUP", "U"]);
  var SPAN_TAG_RE = /\[\[([^\][]+)\]((?:[^\][]|\[[^\][]*\])*)\]/g;
  var OPEN_TAG_RE = /\[\[([^\][]+)\]/g;
  var LITERAL_RE = /\[[^\][]*\]/g;
  var blank = (m) => " ".repeat(m.length);
  function parseClasses(raw) {
    const names = raw.split(",").map((name) => name.trim());
    if (names.some((name) => !/^[\w-]+$/.test(name))) return [];
    return names.map((name) => toClassName(name));
  }
  function createSpan(classes, ...content) {
    const span = document.createElement("span");
    span.className = classes.join(" ");
    span.append(...content);
    return span;
  }
  function getContainer(node) {
    let el = node.parentElement;
    while (INLINE_TAGS.has(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  }
  function getTextNodes(container) {
    const nodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (getContainer(walker.currentNode) === container) nodes.push(walker.currentNode);
    }
    return nodes;
  }
  function replaceInTextNode(node) {
    const text2 = node.nodeValue;
    const parts = [];
    let last = 0;
    [...text2.matchAll(SPAN_TAG_RE)].forEach((match) => {
      const [full, raw, content] = match;
      const classes = parseClasses(raw);
      if (!classes.length) return;
      parts.push(text2.slice(last, match.index), createSpan(classes, content));
      last = match.index + full.length;
    });
    if (!last) return;
    parts.push(text2.slice(last));
    node.replaceWith(...parts.filter((part) => part !== ""));
  }
  function removeIfEmpty(node, container) {
    var _a;
    let current = node;
    while (current !== container && !current.textContent && !((_a = current.querySelector) == null ? void 0 : _a.call(current, "br, img"))) {
      const parent = current.parentNode;
      current.remove();
      current = parent;
    }
  }
  function wrapMultiNodeTag(container) {
    const nodes = getTextNodes(container);
    return nodes.some((openNode, i) => {
      const text2 = openNode.nodeValue;
      const closeAt = (value) => value.replace(OPEN_TAG_RE, blank).replace(LITERAL_RE, blank).indexOf("]");
      const open = [...text2.matchAll(OPEN_TAG_RE)].pop();
      if (!open || closeAt(text2.slice(open.index + open[0].length)) >= 0) return false;
      const classes = parseClasses(open[1]);
      const closeIndex = nodes.findIndex((node, j) => j > i && closeAt(node.nodeValue) >= 0);
      const closeNode = nodes[closeIndex];
      if (!classes.length || !closeNode) return false;
      const opens = (value) => [...value.matchAll(OPEN_TAG_RE)].length > 0;
      const before = closeNode.nodeValue.slice(0, closeAt(closeNode.nodeValue));
      if (nodes.slice(i + 1, closeIndex).some((node) => opens(node.nodeValue)) || opens(before)) {
        return false;
      }
      const range = document.createRange();
      range.setStart(openNode, open.index + open[0].length);
      range.setEnd(closeNode, closeAt(closeNode.nodeValue));
      const span = createSpan(classes, range.extractContents());
      range.insertNode(span);
      openNode.nodeValue = text2.slice(0, open.index);
      closeNode.nodeValue = closeNode.nodeValue.slice(1);
      removeIfEmpty(openNode, container);
      removeIfEmpty(closeNode, container);
      return true;
    });
  }
  function updateHeadingId(heading, authoredText) {
    const slug = (text2) => text2.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const bare = (id2) => id2.replace(/-/g, "");
    if (bare(heading.id) !== bare(slug(authoredText))) return;
    const id = slug(heading.textContent);
    if (id && !document.getElementById(id)) heading.id = id;
  }
  function decorateSpanTags(main) {
    const containers = /* @__PURE__ */ new Set();
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.includes("[[") && !node.parentElement.closest("code, pre, script, style")) {
        containers.add(getContainer(node));
      }
    }
    containers.forEach((container) => {
      const authoredText = container.textContent;
      getTextNodes(container).filter((node) => node.nodeValue.includes("[[")).forEach(replaceInTextNode);
      let wrapped = true;
      while (wrapped) wrapped = wrapMultiNodeTag(container);
      if (/^H[1-6]$/.test(container.tagName) && container.id) {
        updateHeadingId(container, authoredText);
      }
    });
  }

  // ../../../../tmp/run-outputs/lib-wt/scripts/corp-settings.js
  var TEXT_STYLES = {
    display: "size-3vw",
    headline: "size-2-5vw",
    title: "size-2vw",
    lead: "size-1-5vw",
    fluid: "size-1vw",
    large: "size-1-25em",
    serif: "serif",
    sans: "body-font",
    futura: "futura-bold",
    // a whole paragraph or heading: its alignment, or a 40px indent (styles-corp.css)
    center: "align-center",
    right: "align-right",
    indent: "indent"
  };
  ["gold", "white", "light-gray", "gray", "blue", "purple", "teal", "grey", "silver", "dark-gold", "black", "navy"].forEach((color) => {
    TEXT_STYLES[color] = `color-${color}`;
  });
  var COPY_SIZES = { small: "p-0-8", large: "p-1-25", "x-large": "p-1-5" };
  var LABEL_SIZES = { large: "label-1-75" };
  var BOXED = ["padding-top-3", "padding-bottom-3", "padding-left-3", "padding-right-3"];

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/colon-writer.js
  function writeColonMarkers(root) {
    const doc = root.ownerDocument;
    root.normalize();
    const INLINE = /* @__PURE__ */ new Set(["A", "B", "BR", "DEL", "EM", "I", "S", "SPAN", "STRONG", "SUB", "SUP", "U"]);
    const containerOf = (node) => {
      let el = node.parentElement;
      while (INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
      return el;
    };
    const textNodes = (container) => {
      const out = [];
      const w = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) if (containerOf(w.currentNode) === container) out.push(w.currentNode);
      return out;
    };
    const NAME = /^[a-z_-]+[a-z\d]*$/i;
    const marker = (token) => {
      const t = token.trim();
      const size = t.match(/^(\d+)(?:\.(\d+))?\s*(×|x|vw)$/i);
      if (size) return `${size[3].toLowerCase() === "vw" ? "vw" : "x"}${size[1]}${size[2] ? `p${size[2]}` : ""}`;
      return NAME.test(t) ? t : null;
    };
    const errors = [];
    let markers = 0;
    root.querySelectorAll("p").forEach((p) => {
      if (/^\[\[\s*blank line\s*\]\]$/i.test(p.textContent.trim())) {
        p.textContent = ":blank-line:";
        markers += 1;
      }
    });
    const containers = /* @__PURE__ */ new Set();
    const all = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (all.nextNode()) {
      const n = all.currentNode;
      if (n.nodeValue.includes("[[") && !n.parentElement.closest("code, pre")) containers.add(containerOf(n));
    }
    containers.forEach((container) => {
      const nodes = textNodes(container);
      const before = nodes.map((n) => n.nodeValue);
      const stack = [];
      const ends = [];
      let ok = true;
      let pending = null;
      const after = [];
      const reopen = (k) => {
        if (!pending) return;
        const runOf = pending.frames.flat().map((x) => `:${x}:`).join("");
        markers += pending.frames.flat().length;
        const here = nodes[k].parentElement === pending.parent;
        if (here) after[k] += runOf;
        else after[pending.k] += runOf;
        stack.push({ frames: pending.frames, parent: pending.parent });
        pending = null;
      };
      before.forEach((text2, k) => {
        after[k] = "";
        let i = 0;
        let lastWasOpen = false;
        while (i < text2.length) {
          const open = text2.slice(i).match(/^\[\[([^\][]+)\]/);
          const literal = text2.slice(i).match(/^\[[^\][]*\]/);
          if (text2[i] === "]" && pending) {
            pending.frames.pop();
            if (!pending.frames.length) pending = null;
            i += 1;
          } else if (open) {
            reopen(k);
            const names = open[1].split(",").map(marker);
            if (names.some((x) => !x)) ok = false;
            after[k] += names.map((x) => `:${x}:`).join("");
            markers += names.length;
            if (lastWasOpen && stack.length) stack[stack.length - 1].frames.push(names);
            else stack.push({ frames: [names], parent: nodes[k].parentElement });
            lastWasOpen = true;
            i += open[0].length;
          } else if (literal && !text2.startsWith("[[", i)) {
            reopen(k);
            after[k] += literal[0];
            lastWasOpen = false;
            i += literal[0].length;
          } else if (text2[i] === "]" && stack.length) {
            const group = stack.pop();
            group.frames.pop();
            const id = `\uE000E${ends.length}\uE000`;
            ends.push({ id, parent: group.parent });
            after[k] += id;
            i += 1;
            if (group.frames.length) {
              pending = { frames: group.frames, k, parent: nodes[k].parentElement };
            }
            lastWasOpen = false;
          } else {
            reopen(k);
            after[k] += text2[i];
            lastWasOpen = false;
            i += 1;
          }
        }
      });
      if (!ok || stack.length) {
        errors.push(container.textContent.slice(0, 80));
        return;
      }
      nodes.forEach((n, k) => {
        n.nodeValue = after[k];
      });
      const PLACE = /\uE000E\d+\uE000/g;
      const MERGES = /^(A|B|EM|I|S|SPAN|STRONG|SUB|SUP|U)$/;
      const followed = (el) => {
        let x = el;
        while (x !== container && !x.nextSibling) x = x.parentElement;
        const next = x === container ? null : x.nextSibling;
        return (next == null ? void 0 : next.nodeType) === 1 && MERGES.test(next.tagName);
      };
      const drop = new Set(ends.filter(({ id, parent }) => {
        if (parent !== container && followed(parent)) return false;
        const t = parent.textContent;
        const at = t.indexOf(id);
        return at >= 0 && !t.slice(at + id.length).replace(PLACE, "").trim();
      }).map((e) => e.id));
      ends.filter(({ id, parent }) => !parent.textContent.includes(id)).forEach(() => errors.push(`cross: ${container.textContent.slice(0, 80)}`));
      const AFTER_URL = /(\S*?)(:[a-z_-]+[a-z\d]*:)/gi;
      nodes.forEach((n) => {
        n.nodeValue = n.nodeValue.replace(PLACE, (id) => drop.has(id) ? "" : ":end:").replace(AFTER_URL, (m, run, mark) => /https?|urn/i.test(run) ? `${run}\uFEFF${mark}` : m);
      });
    });
    root.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]").forEach((h) => {
      if (!h.textContent.includes(":")) return;
      h.id = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    });
    const left = errors.length ? `; left as bracket tags: ${errors.length} (${errors.slice(0, 3).join(" | ")})` : "";
    return [`colon markers: ${markers}${left}`];
  }
  var isRow = (row, name) => {
    var _a;
    return new RegExp(`^${name}$`, "i").test(((_a = row.firstElementChild) == null ? void 0 : _a.textContent.trim()) || "");
  };
  var MARKER = new RegExp("(?<!(?:https?|urn)[^\\s]*):(#?[a-z_-]+[a-z\\d]*):", "gi");
  function ensureDescription(root) {
    const meta = root.querySelector(".metadata");
    if (!meta || [...meta.children].some((r) => isRow(r, "description"))) return [];
    const clean = (t) => t.replace(MARKER, "").replace(/\s+/g, " ").trim();
    const text2 = [...root.querySelectorAll("p")].filter((x) => !x.closest(".metadata, .section-metadata")).map((x) => clean(x.textContent)).find((t) => !/^box(:| end)/i.test(t) && t.split(" ").length > 10);
    if (!text2) return ["description: none found"];
    const words = text2.split(" ");
    const doc = root.ownerDocument;
    const row = doc.createElement("div");
    const k = doc.createElement("div");
    const v = doc.createElement("div");
    k.textContent = "Description";
    v.textContent = words.length > 25 ? `${words.slice(0, 25).join(" ")} ...` : text2;
    row.append(k, v);
    const title = [...meta.children].find((r) => isRow(r, "title"));
    if (title) title.after(row);
    else meta.prepend(row);
    return ["description: added"];
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/settings-writer.js
  var toClassName2 = (name) => name.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  function convertReadable(root) {
    const doc = root.ownerDocument;
    const report = [];
    if (root.querySelector("span")) report.push("warning: the page already has spans");
    decorateSpanTags(root);
    const inv = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
    const TEXT = inv(TEXT_STYLES);
    const COPY = inv(COPY_SIZES);
    const LABEL = inv(LABEL_SIZES);
    const label = (n) => n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("-");
    const SPACING = /^(padding|margin)-(top|bottom|left|right)-(minus-)?(\d+)(?:-(\d+))?(px)?$/;
    const INSET = /^(top|bottom|left|right)-(\d+)(?:-(\d+))?$/;
    const num = (int, dec) => dec ? `${int}.${dec}` : int;
    const formatSpacing = (tokens, withKind) => {
      const byKind = {};
      tokens.forEach((t) => {
        const [, kind, side, minus, int, dec, px] = t.match(SPACING);
        (byKind[kind] = byKind[kind] || {})[side] = `${minus ? "-" : ""}${num(int, dec)}${px ? "px" : "%"}`;
      });
      const parts = {};
      Object.entries(byKind).forEach(([kind, s]) => {
        const e = [];
        const pre = withKind ? `${kind} ` : "";
        if (s.top && s.top === s.bottom && s.top === s.left && s.top === s.right) {
          e.push(`${pre}all ${s.top}`);
        } else {
          if (s.top) e.push(`${pre}top ${s.top}`);
          if (s.bottom) e.push(`${pre}bottom ${s.bottom}`);
          if (s.left && s.left === s.right) e.push(`${pre}sides ${s.left}`);
          else {
            if (s.left) e.push(`${pre}left ${s.left}`);
            if (s.right) e.push(`${pre}right ${s.right}`);
          }
        }
        parts[kind] = e.join(", ");
      });
      return parts;
    };
    const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
    const hasMedia = (cell) => cell.querySelector("picture, img, video, iframe") || [...cell.querySelectorAll("a[href]")].some((a) => /media-assets\.stryker\.com|scene7|\.m3u8|youtube|vimeo/.test(a.href));
    const textColumn = (columns) => {
      var _a;
      const cells = [...((_a = columns.firstElementChild) == null ? void 0 : _a.children) || []];
      const text2 = cells.map((c, i) => hasMedia(c) ? 0 : i + 1).filter(Boolean);
      return text2.length === 1 ? text2[0] : 0;
    };
    const styleSet = (node, container) => {
      const set = /* @__PURE__ */ new Set();
      for (let el = node.parentElement; el && el !== container; el = el.parentElement) {
        if (el.tagName === "SPAN") el.classList.forEach((c) => set.add(c));
      }
      return set;
    };
    const textNodes = (el) => {
      const w = doc.createTreeWalker(
        el,
        4
        /* NodeFilter.SHOW_TEXT */
      );
      const nodes = [];
      while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
      return nodes;
    };
    const leadsWithBreak = (el) => {
      let n = el.firstChild;
      while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
      return !!n && n.nodeType === 1 && n.tagName === "SPAN" && (() => {
        let m = n.firstChild;
        while (m && m.nodeType === 3 && !m.nodeValue.trim()) m = m.nextSibling;
        return !!m && (m.nodeName === "BR" || m.nodeName === "SPAN" && leadsWithBreak(n));
      })();
    };
    const liftStyle = (targets) => {
      const nodes = targets.flatMap((t) => textNodes(t).map((n) => [n, t]));
      if (!nodes.length || targets.some(leadsWithBreak)) return null;
      const sets = nodes.map(([n, t]) => styleSet(n, t));
      const common = [...sets[0]].filter((c) => TEXT[c] && sets.every((s) => s.has(c)));
      if (!common.length) return null;
      targets.forEach((t) => t.querySelectorAll("span").forEach((span) => {
        common.forEach((c) => span.classList.remove(c));
        if (!span.classList.length) span.replaceWith(...span.childNodes);
      }));
      const colors = common.filter((c) => c.startsWith("color-"));
      return [...colors, ...common.filter((c) => !colors.includes(c))].map((c) => label(TEXT[c])).join(", ");
    };
    const sections = [...root.children].filter((el) => el.tagName === "DIV");
    sections.forEach((sec, i) => {
      const name = `S${i + 1}`;
      let meta = sec.querySelector(":scope > .section-metadata");
      if (sec.querySelector(":scope > .metadata")) return;
      const rows = [];
      let styleCell = null;
      let styles = [];
      meta == null ? void 0 : meta.querySelectorAll(":scope > div").forEach((row) => {
        var _a;
        if (((_a = row.children[0]) == null ? void 0 : _a.textContent.trim().toLowerCase()) === "style") {
          [, styleCell] = row.children;
          styles = styleCell.textContent.split(",").map((s) => s.trim()).filter(Boolean);
        }
      });
      const hero = sec.querySelector(":scope > .hero-corp");
      const columns = [...sec.querySelectorAll(":scope > .columns")];
      const keep = [];
      const secSpacing = [];
      let copy = "";
      let lbl = "";
      let widths = "";
      let hsize = "";
      let auto = "";
      let blank2 = "";
      let pieces = "";
      const column = [];
      const multiple = (s, prefix) => {
        const m = s.match(/^([a-z]+)-(\d+)(?:-(\d+))?$/);
        return m && m[1] === prefix ? `${num(m[2], m[3])}\xD7` : "";
      };
      styles.forEach((s) => {
        if (SPACING.test(s)) secSpacing.push(s);
        else if (COPY[s]) copy = label(COPY[s]);
        else if (LABEL[s]) lbl = label(LABEL[s]);
        else if (multiple(s, "p")) copy = multiple(s, "p");
        else if (multiple(s, "label")) lbl = multiple(s, "label");
        else if (multiple(s, "h")) hsize = multiple(s, "h");
        else if (/^autoplay-\d+$/.test(s)) auto = `${Number(s.slice(9)) / 1e3} s`;
        else if (/^lines-\d+$/.test(s) && styles.includes("spacer")) blank2 = s.slice(6);
        else if (/^flex-cols-\d+(-\d+)+$/.test(s)) pieces = s.slice(10).split("-").join(" + ");
        else if (/^col-\d+-\d+$/.test(s)) column.unshift(`width ${s.slice(4).replace("-", "/")}`);
        else if (/^col-at-\d+-\d+$/.test(s)) column.push(`from ${s.slice(7).replace("-", "/")}`);
        else if (s === "col-phone") column.push("phones too");
        else if (/^flex-\d+(-\d+)+$/.test(s) && !columns.length) widths = s.slice(5).split("-").map((w) => `${w}%`).join(" / ");
        else keep.push(s);
      });
      let spacing = secSpacing;
      let inset = "";
      if (hero) {
        const cls = [...hero.classList];
        const heroSpacing = cls.filter((c) => SPACING.test(c));
        const insets = cls.filter((c) => INSET.test(c));
        if (secSpacing.length) {
          keep.push(...secSpacing);
          spacing = [];
          report.push(`${name}: section spacing next to a hero kept as classes`);
        }
        if (heroSpacing.length && !secSpacing.length) {
          spacing = heroSpacing;
          hero.classList.remove(...heroSpacing);
        }
        if (insets.length) {
          inset = insets.map((c) => {
            const [, side, int, dec] = c.match(INSET);
            return `${side} ${num(int, dec)}%`;
          }).join(", ");
          hero.classList.remove(...insets);
        }
      }
      const fs = formatSpacing(spacing, false);
      if (fs.padding) rows.push(["Padding", fs.padding]);
      if (fs.margin) rows.push(["Margin", fs.margin]);
      if (inset) rows.push(["Text box", inset]);
      const GRID = /^grid-(?:([tm])-)?((?:of\d+-)?(?:(?:o\d+-)?n?\d+|h)(?:-(?:o\d+-)?n?\d+|-h)*)$/;
      const gridPart = (bp, value) => {
        const of = value.match(/^of(\d+)-(.+)$/);
        const items = (of ? of[2] : value).split("-").map((t2) => {
          if (t2 === "h") return "hidden";
          if (t2.startsWith("o")) return `skip ${t2.slice(1)}`;
          if (t2.startsWith("n")) return `new line ${t2.slice(1)}`;
          return t2;
        });
        return `${bp}: ${items.join(", ")}${of ? ` of ${of[1]}` : ""}`;
      };
      const colWidths = columns.map((col) => [...col.classList].find((c) => /^columns-\d+(-\d+)+$/.test(c)));
      const sharedWidths = colWidths.length && colWidths[0] && colWidths.every((c) => c === colWidths[0]);
      if (sharedWidths) {
        widths = colWidths[0].slice(8).split("-").map((x) => `${x}%`).join(" / ");
        columns.forEach((col) => col.classList.remove(colWidths[0]));
      }
      columns.forEach((col, ci) => {
        const k = ci + 1;
        const suffix = k > 1 || hero ? ` (${k})` : "";
        const cls = [...col.classList];
        if (!sharedWidths && colWidths[ci]) {
          rows.push([`Column widths (${k})`, colWidths[ci].slice(8).split("-").map((x) => `${x}%`).join(" / ")]);
          col.classList.remove(colWidths[ci]);
        }
        const byCell = {};
        const colours = [];
        const borders = [];
        const grid = {};
        cls.forEach((c) => {
          const m = c.match(/^cell-(\d+)-(.+)$/);
          if (m && SPACING.test(m[2])) {
            (byCell[m[1]] = byCell[m[1]] || []).push(m[2]);
            col.classList.remove(c);
          } else if (m && /^(bg-[a-z-]+|dark)$/.test(m[2])) {
            colours.push([m[1], m[2]]);
            col.classList.remove(c);
          } else if (m && /^image-border(-[a-z]+)?$/.test(m[2])) {
            borders.push([m[1], m[2] === "image-border" ? "teal" : m[2].slice(13)]);
            col.classList.remove(c);
          }
          const g = c.match(GRID);
          if (g) {
            const [, bp, value] = g;
            grid[bp || "d"] = value;
            col.classList.remove(c);
          }
        });
        const coloured = new Set(colours.map(([n]) => n));
        const parts = Object.entries(byCell).map(([cell, tokens]) => {
          const forms = coloured.has(cell) ? [BOXED] : [
            BOXED,
            BOXED.map((t2) => t2 === "padding-left-3" ? "margin-left-3" : t2),
            BOXED.map((t2) => t2 === "padding-right-3" ? "margin-right-3" : t2)
          ];
          if (forms.some((f2) => same(f2, tokens))) {
            return Number(cell) === textColumn(col) ? "boxed" : `column ${cell}: boxed`;
          }
          const f = formatSpacing(tokens, true);
          const value = [f.padding, f.margin].filter(Boolean).join(", ").replace(/padding /g, "");
          return `column ${cell}: ${value}`;
        });
        if (parts.length) rows.push([`Text box${suffix}`, parts.join("; ")]);
        const gridParts = [["d", "desktop"], ["t", "tablet"], ["m", "phone"]].filter(([bp]) => grid[bp]).map(([bp, bpName]) => gridPart(bpName, grid[bp]));
        if (gridParts.length) rows.push([`Grid${suffix.replace(" (1)", "")}`, gridParts.join(" \xB7 ")]);
        if (colours.length) {
          rows.push([`Cell colours${suffix.replace(" (1)", "")}`, colours.map(([n, c]) => `${n}: ${label(c === "dark" ? "dark" : c.slice(3))}`).join(", ")]);
        }
        if (borders.length) {
          rows.push([`Image borders${suffix.replace(" (1)", "")}`, borders.map(([n, c]) => `${n}: ${label(c)}`).join(", ")]);
        }
      });
      if (widths) rows.push(["Column widths", widths]);
      if (column.length) rows.push(["Column", column.join(", ")]);
      if (copy) rows.push(["Copy size", copy]);
      if (lbl) rows.push(["Label size", lbl]);
      if (hsize) rows.push(["Heading size", hsize]);
      if (auto) rows.push(["Autoplay", auto]);
      if (blank2) rows.push(["Blank lines", blank2]);
      if (pieces) rows.push(["Columns", pieces]);
      const headings = [...sec.querySelectorAll(":scope > :is(h1, h2, h3, h4, h5, h6)")];
      const texts = [...sec.querySelectorAll(":scope > p, :scope > ul > li, :scope > ol > li, :scope > .accordion > div > div:nth-child(2)")].filter((el) => !/^(\[\[blank line\]\]|column break)$/i.test(el.textContent.trim()));
      const h = headings.length ? liftStyle(headings) : null;
      if (h) rows.push(["Headings", h]);
      const t = texts.length ? liftStyle(texts) : null;
      if (t) rows.push(["Text", t]);
      if (!rows.length && keep.length === styles.length) return;
      if (!meta) {
        meta = doc.createElement("div");
        meta.className = "section-metadata";
        sec.append(meta);
      }
      if (styleCell) {
        if (keep.length) styleCell.textContent = keep.join(", ");
        else styleCell.parentElement.remove();
      }
      rows.forEach(([k, v]) => {
        const row = doc.createElement("div");
        const a = doc.createElement("div");
        const b = doc.createElement("div");
        a.textContent = k;
        b.textContent = v;
        row.append(a, b);
        meta.append(row);
      });
      report.push(`${name}: ${rows.map(([k, v]) => `${k}: ${v}`).join(" | ")}`);
    });
    const nameOf = (c) => {
      if (TEXT[c]) return label(TEXT[c]);
      const m = c.match(/^size-(\d+)(?:-(\d+))?(em|vw)$/);
      return m ? `${num(m[1], m[2])}${m[3] === "vw" ? "vw" : "\xD7"}` : null;
    };
    const named = (span) => [...span.classList].every(nameOf);
    let legacy = 0;
    let byName = 0;
    let boxes = 0;
    [...root.querySelectorAll("span")].forEach((span) => {
      if (!root.contains(span)) return;
      let classes = [...span.classList];
      const p = span.parentElement;
      if (classes[0] === "spacing" && (p == null ? void 0 : p.tagName) === "P" && p.childNodes.length === 1 && !span.textContent.trim()) {
        const colour = /^(bg-[a-z-]+|dark)$/.test(classes[1] || "") ? classes[1] : "";
        const shadow = classes.includes("shadow");
        const tokens = classes.slice(colour ? 2 : 1).filter((tk) => tk !== "shadow");
        if (tokens.every((tk) => SPACING.test(tk))) {
          const f = formatSpacing(tokens, true);
          const value = [colour ? label(colour.replace(/^bg-/, "")) : "", shadow ? "Shadow" : "", f.padding, f.margin].filter(Boolean).join(", ").replace(/padding /g, "");
          p.textContent = tokens.length || colour || shadow ? `Box: ${value}` : "Box end";
          boxes += 1;
          return;
        }
      }
      let content = [...span.childNodes].filter((n) => n.nodeType !== 3 || n.nodeValue !== "");
      const only = content.length === 1 && content[0].tagName === "SPAN" ? content[0] : null;
      if (named(span) && only && named(only)) {
        classes = [...classes, ...only.classList];
        content = [...only.childNodes];
      }
      const tag = classes.every(nameOf) ? classes.map(nameOf) : classes;
      if (classes.every(nameOf)) byName += 1;
      else legacy += 1;
      span.replaceWith(`[[${tag.join(",")}]`, ...content, "]");
    });
    report.push(`bracket tags: ${byName} by name or value, ${legacy} kept with legacy classes; ${boxes} Box lines`);
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((hd) => {
      const slug = hd.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (hd.id) hd.id = slug;
    });
    const md = root.querySelector(".metadata");
    if (md) {
      const row = doc.createElement("div");
      const a = doc.createElement("div");
      const b = doc.createElement("div");
      a.textContent = "style-settings";
      b.textContent = "on";
      row.append(a, b);
      md.append(row);
    }
    return report;
  }
  function toPlain(main, document2) {
    const root = document2.createElement("div");
    const blocks = /* @__PURE__ */ new Map();
    let section = document2.createElement("div");
    root.append(section);
    [...main.childNodes].forEach((node) => {
      if (node.nodeName === "HR") {
        section = document2.createElement("div");
        root.append(section);
      } else if (node.nodeName === "TABLE") {
        const rows = [...node.rows];
        const header = rows[0].cells[0].textContent.trim();
        const [, name, variants] = header.match(/^([^(]*?)\s*(?:\((.*)\))?$/) || [null, header, ""];
        const div = document2.createElement("div");
        div.className = [name, ...(variants || "").split(",")].map((v) => toClassName2(v.trim())).filter(Boolean).join(" ");
        const cells = rows.slice(1).map((tr) => {
          const row = document2.createElement("div");
          div.append(row);
          return [...tr.cells].map((td) => {
            const cell = document2.createElement("div");
            cell.append(...td.childNodes);
            row.append(cell);
            return td;
          });
        });
        blocks.set(div, { table: node, name, cells });
        section.append(div);
      } else {
        section.append(node);
      }
    });
    main.replaceChildren();
    return { root, blocks };
  }
  function toImport(main, document2, root, blocks) {
    [...root.children].forEach((section, i) => {
      if (i) main.append(document2.createElement("hr"));
      [...section.childNodes].forEach((node) => {
        const kind = node.nodeType === 1 ? node.className : "";
        if (kind === "section-metadata" || kind === "metadata") {
          const cells = [...node.children].map((row) => [row.children[0].textContent, [...row.children[1].childNodes]]);
          const name = kind === "metadata" ? "Metadata" : "Section Metadata";
          if (cells.length) main.append(WebImporter.Blocks.createBlock(document2, { name, cells }));
          return;
        }
        const block = blocks.get(node);
        if (!block) {
          main.append(node);
          return;
        }
        const variants = [...node.classList].slice(1);
        block.table.rows[0].cells[0].textContent = variants.length ? `${block.name} (${variants.join(", ")})` : block.name;
        [...node.children].forEach((row, r) => [...row.children].forEach((cell, c) => {
          block.cells[r][c].append(...cell.childNodes);
        }));
        main.append(block.table);
      });
    });
  }
  function writeReadableSettings(main, document2) {
    if (typeof window !== "undefined" && window.CORP_WRITER_OFF) return [];
    const { root, blocks } = toPlain(main, document2);
    root.querySelectorAll("span:not(.icon)").forEach((span) => span.replaceWith(...span.childNodes));
    const report = convertReadable(root);
    report.push(...writeColonMarkers(root), ...ensureDescription(root));
    toImport(main, document2, root, blocks);
    return report;
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/root.js
  var ROOT = "/rs";
  var rooted = (path) => path.startsWith(`${ROOT}/`) ? path : `${ROOT}${path}`;
  var FRAGMENT = /^\/us\/en\/fragments\//;
  function rootFragmentLinks(main) {
    main.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!FRAGMENT.test(href)) return;
      if (a.textContent.trim() === href) a.textContent = rooted(href);
      a.setAttribute("href", rooted(href));
    });
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/import-corp-cf-fragments.js
  var import_corp_cf_fragments_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const cf = source.searchParams.get("cf");
      const info = cf && CONTENT_FRAGMENTS[cf];
      if (!info) throw new Error(`Not a content fragment in data/cf-index.js: ${cf}`);
      const rendered = document2.querySelector(`dl.cmp-contentfragment[data-path="${cf}"]`);
      if (!rendered) console.warn(`[import-corp-cf-fragments] ${cf} is not rendered on ${source.pathname}: fields from the export only`);
      const main = document2.createElement("div");
      main.append(...contentFragmentBlocks(document2, info, rendered));
      writeReadableSettings(main, document2);
      rootFragmentLinks(main);
      document2.body.replaceChildren(main);
      return [{
        element: main,
        path: rooted(info.eds),
        report: {
          title: info.title || info.eds,
          template: "content-fragment",
          source: cf,
          uses: info.uses.length
        }
      }];
    }
  };
  return __toCommonJS(import_corp_cf_fragments_exports);
})();
