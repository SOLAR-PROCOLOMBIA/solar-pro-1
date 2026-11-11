import { supabase } from "./supabase";

// REGISTRAR NUEVO USUARIO
export async function registrarUsuario(nombre, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: nombre
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

// INICIAR SESIÓN
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

// CERRAR SESIÓN
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

// CONSULTAR PERFIL Y AUTORIZACIÓN
export async function consultarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}