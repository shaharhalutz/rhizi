"use strict"

function signup_form___submit() {

    function validate_data(data) {
        var err_msg_row = $('#err_msg_row'); // reset
        err_msg_row.children().remove();
        if (data.password_first != data.password_second) {
            err_msg_row.append($('<p>passwords do not match</p>'));
            err_msg_row.css('display', 'block');
            return false;
        }
        if (data.password_first.length < 8) {
            err_msg_row.append($('<p>password too short - must be at least 8 charachters long</p>'));
            err_msg_row.css('display', 'block');
            return false;
        }

        // TODO validate email

        err_msg_row.css('display', 'none');
        return true;
    }

    var form_data = {
        first_name : $('#signup_form___first_name').val(),
        last_name : $('#signup_form___last_name').val(),
        rz_username : $('#signup_form___rz_username').val(),
        email_address : $('#signup_form___email_address').val(),
        password_first : $('#signup_form___password_first').val(),
        password_second : $('#signup_form___password_second').val(),
    };

    if (false == validate_data(form_data)) {
        return;
    }

    // construct post data
    var post_data = $.extend({}, form_data, {
        pw_plaintxt: form_data.password_first // rename field
    });
    delete post_data.password_first
    delete post_data.password_second

    $.ajax({
         type : "POST",
         url : '/signup',
         async : false,
         cache : false,
         data : JSON.stringify(post_data),
         dataType : 'json',
         contentType : "application/json; charset=utf-8",
         success : function(data, status, xhr) {
             var signup_form__ajax_response = $('#signup_form__ajax_response'); // reset
             signup_form__ajax_response.children().remove();
             signup_form__ajax_response.append($(data.response__html));
         },
         error : function(xhr, status, err_thrown) {
             var signup_form__ajax_response = $('#signup_form__ajax_response'); // reset
             signup_form__ajax_response.children().remove();
             signup_form__ajax_response.append($(data.response__html));
         }
     });
}
