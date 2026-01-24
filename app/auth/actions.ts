"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        return { error: error.message };
    }

    redirect("/");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        full_name: formData.get("full_name") as string,
    };

    const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.full_name,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    redirect("/");
}

export async function signout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
