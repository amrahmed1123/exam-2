export class Notifier {
  static async ensureLoaded() {
    if (window.Swal) return;
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  get swal() {
    return window.Swal;
  }

  toast(icon, title) {
    this.swal?.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 2400,
      timerProgressBar: true
    });
  }

  success(message) {
    this.toast("success", message);
  }

  error(message) {
    this.toast("error", message);
  }

  warning(message) {
    this.toast("warning", message);
  }

  banner(message) {
    this.swal?.fire({
      toast: true,
      position: "bottom-end",
      title: message,
      showConfirmButton: false,
      timer: 2600,
      customClass: { popup: "toast-blue" }
    });
  }

  fire(options) {
    return this.swal.fire({ confirmButtonColor: "#059669", ...options });
  }

  logged({ title, name, amount, calories }) {
    return this.fire({
      icon: "success",
      title,
      html: `${name} (${amount}) has been added to your daily log.<br /><strong class="log-plus">+${calories} calories</strong>`,
      showConfirmButton: false,
      timer: 2200
    });
  }

  async confirmClear() {
    const result = await this.fire({
      icon: "warning",
      title: "Clear Today's Log?",
      text: "This will remove all logged food items for today.",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280"
    });
    return result.isConfirmed;
  }

  async askText({ title, text, placeholder = "" }) {
    const result = await this.fire({
      title,
      text,
      input: "text",
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: "Save",
      inputValidator: (input) => (!input || !input.trim() ? "This field can't be empty" : undefined)
    });
    return result.isConfirmed ? result.value.trim() : null;
  }
}
