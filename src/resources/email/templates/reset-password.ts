export const generateResetPasswordEmail = (firstName: string, url: string) => `<!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">

<head>
  <title></title>
  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
	<meta name="x-apple-disable-message-reformatting">
	<meta name="color-scheme" content="light dark">
	<meta name="supported-color-schemes" content="light dark">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet"
    type="text/css" /><!--<![endif]-->
  <title>Reset Password</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: inherit !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
    }

    p {
      line-height: inherit
    }

    .desktop_hide,
    .desktop_hide table {
      mso-hide: all;
      display: none;
      max-height: 0px;
      overflow: hidden;
    }

    .image_block img+div {
      display: none;
    }

    @media (max-width:520px) {

      .desktop_hide table.icons-inner,
      .social_block.desktop_hide .social-table {
        display: inline-block !important;
      }

      .icons-inner {
        text-align: center;
      }

      .icons-inner td {
        margin: 0 auto;
      }

      .mobile_hide {
        display: none;
      }

      .row-content {
        width: 100% !important;
      }

      .stack .column {
        width: 100%;
        display: block;
      }

      .mobile_hide {
        min-height: 0;
        max-height: 0;
        max-width: 0;
        overflow: hidden;
        font-size: 0px;
      }

      .desktop_hide,
      .desktop_hide table {
        display: table !important;
        max-height: none !important;
      }
    }
  </style>
</head>

<body style="margin: 0; background-color: #fff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation"
    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fff;" width="100%">
    <tbody>
      <tr>
        <td>
          <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-image: url('https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693844553/node-ts-api/public-assets/milkyway-8190232_1280_f92vvk.jpg'); background-repeat: no-repeat; background-size: auto;"
            width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
                    role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto; color: #000; width: 600px; margin: 0 auto;"
                    width="600">
                    <tbody>
                      <tr>
                        <td class="column column-1"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                          width="100%">
                          <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1"
                            role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tr>
                              <td class="pad" style="width:100%;">
                                <div align="center" class="alignment" style="line-height:10px"><img alt="milkyway"
                                    src="https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693844553/node-ts-api/public-assets/milkyway-8190232_1280-crop_ciuawk.jpg"
                                    style="display: block; height: auto; border: 0; max-width: 600px; width: 100%;"
                                    title="milkyway" width="600" /></div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
                    role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000; width: 600px; margin: 0 auto;"
                    width="600">
                    <tbody>
                      <tr>
                        <td class="column column-1"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                          width="100%">
                          <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1"
                            role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                            <tr>
                              <td class="pad">
                                <div
                                  style="color:#101112;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
                                  <p style="margin: 0; margin-bottom: 16px; text-transform: capitalize;">Hi ${firstName}</p>
                                  <p style="margin: 0;">We received a request to reset your password, you can click the
                                    button below to approve the request</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table border="0" cellpadding="10" cellspacing="0" class="button_block block-2"
                            role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tr>
                              <td class="pad">
                                <div align="center" class="alignment">
                                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:42px;width:154px;v-text-anchor:middle;" arcsize="10%" stroke="false" fillcolor="#3b4ecf"><w:anchorlock/><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff; font-family:Tahoma, Verdana, sans-serif; font-size:16px"><![endif]--><a
                                    href="${url}"
                                    style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#3b4ecf;border-radius:4px;width:auto;border-top:0px solid transparent;font-weight:400;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:5px;padding-bottom:5px;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"
                                    target="_blank"><span
                                      style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span
                                        style="word-break: break-word; line-height: 32px;">Reset
                                        password</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-3"
                            role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                            <tr>
                              <td class="pad">
                                <div
                                  style="color:#101112;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
                                  <p style="margin: 0; margin-bottom: 16px;">Button not working? Paste the following
                                    link into your browser:</p>
                                  <p style="margin: 0; margin-bottom: 16px;">${url}</p>
                                  <p style="margin: 0; margin-bottom: 16px;">For your security, the reset password link
                                    will expire after 1 hour.</p>
                                  <p style="margin: 0; margin-bottom: 16px;">If you believe that this request is
                                    suspicious, please contact our <a
                                      href="mailto:samuelwisdom360@gmail.com?subject=Verification Enquiry"
                                      style="text-decoration: none;">support team</a>.</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table border="0" cellpadding="10" cellspacing="0" class="social_block block-4"
                            role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tr>
                              <td class="pad">
                                <div align="center" class="alignment">
                                  <table border="0" cellpadding="0" cellspacing="0" class="social-table"
                                    role="presentation"
                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;"
                                    width="144px">
                                    <tr>
                                      <td style="padding:0 2px 0 2px;"><a href="https://web.facebook.com/snowsenpaii/"
                                          target="_blank"><img alt="Facebook" height="32" src="https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693898435/node-ts-api/public-assets/facebook2x_rjombe.png"
                                            style="display: block; height: auto; border: 0;" title="facebook"
                                            width="32" /></a></td>
                                      <td style="padding:0 2px 0 2px;"><a href="https://twitter.com/snowsenpa"
                                          target="_blank"><img alt="Twitter" height="32" src="https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693898434/node-ts-api/public-assets/twitter2x_tcgahu.png"
                                            style="display: block; height: auto; border: 0;" title="twitter"
                                            width="32" /></a></td>
                                      <td style="padding:0 2px 0 2px;"><a
                                          href="https://www.linkedin.com/in/samuel-umoh-a705a91a5/" target="_blank"><img
                                            alt="Linkedin" height="32" src="https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693898434/node-ts-api/public-assets/linkedin2x_wm46re.png"
                                            style="display: block; height: auto; border: 0;" title="linkedin"
                                            width="32" /></a></td>
                                      <td style="padding:0 2px 0 2px;"><a href="https://www.instagram.com/snowsenpai_/"
                                          target="_blank"><img alt="Instagram" height="32" src="https://res.cloudinary.com/dwmwo3mpo/image/upload/v1693898434/node-ts-api/public-assets/instagram2x_b2ilxh.png"
                                            style="display: block; height: auto; border: 0;" title="instagram"
                                            width="32" /></a></td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><!-- End -->
</body>

</html>`;
