import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service';
export declare const ROLES_KEY = "roles";
export declare class RolesGuard implements CanActivate {
    private reflector;
    private supabaseService;
    constructor(reflector: Reflector, supabaseService: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
