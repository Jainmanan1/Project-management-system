import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagelink.com",
    },
  });
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMPT_HOST,
    port: process.env.MAILTRAP_SMPT_PORT,
    auth: {
      user: process.env.MAILTRAP_SMPT_USER,
      pass: process.env.MAILTRAP_SMPT_PASS,
    },
  });
  const mail = await transporter.sendMail({
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  });
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed siliently. make sure  that you have provided  yout MAILTRAP credentials in .env file ",
    );
    console.error("ERROR: ", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "welecome to our App ! We're very excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following Button",
        button: {
          color: "#22BC66",
          text: "Confirm your Account",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordReset) => {
  return {
    body: {
      name: username,
      intro: "We go a request to Reset the Password of your Account",
      action: {
        instructions:
          "To reset your password  click on the following  button or link",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordReset,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
