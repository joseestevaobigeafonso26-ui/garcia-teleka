import { redirect } from "next/navigation";

// O admin vive dentro do site. Links antigos para /admin abrem o login na página inicial.
export default function AdminRedirect() {
  redirect("/?admin=1");
}
