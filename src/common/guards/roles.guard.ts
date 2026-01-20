import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private supabaseService: SupabaseService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get user's role from database
        const { data: profile } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            throw new ForbiddenException('User profile not found');
        }

        const hasRole = requiredRoles.includes(profile.role);

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        // Attach role to request for later use
        request.userRole = profile.role;

        return true;
    }
}
