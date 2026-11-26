package com.dentsbackend.config;

import com.dentsbackend.entities.*;
import com.dentsbackend.repositories.GroupRepository;
import com.dentsbackend.repositories.UserRepository;
import com.dentsbackend.services.StudentPWService;
import com.dentsbackend.utils.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;

@Component
public class ApiSecurityFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_AUTH_PATHS = Set.of(
            "/api/users/login",
            "/api/users/register/professor",
            "/api/users/codeactivation",
            "/api/users/verifiercode",
            "/api/users/resetpwd"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private StudentPWService studentPWService;

    @Value("${app.demo.readonly:false}")
    private boolean demoReadOnly;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsRaw;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (!path.startsWith("/api/") || HttpMethod.OPTIONS.matches(method) || "/api/health".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (demoReadOnly && isMutatingMethod(method) && !"/api/users/login".equals(path)) {
            writeError(request, response, HttpServletResponse.SC_FORBIDDEN,
                    "Public demo mode is read-only. Changes cannot be saved.");
            return;
        }

        if (PUBLIC_AUTH_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        User authUser = authenticate(request);
        if (authUser == null) {
            writeError(request, response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required.");
            return;
        }

        if (!isAuthorized(authUser, method, path)) {
            writeError(request, response, HttpServletResponse.SC_FORBIDDEN,
                    "You are not authorized to perform this action.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isMutatingMethod(String method) {
        return HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
    }

    private User authenticate(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7).trim();
        String subject = JwtTokenUtil.extractSubject(token);
        if (subject == null || subject.isEmpty()) {
            return null;
        }

        Long userId = parseLeadingId(subject);
        if (userId == null) {
            return null;
        }
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) {
            return null;
        }
        User user = opt.get();
        String expectedSubject = user.getId() + user.getUserName();
        return expectedSubject.equals(subject) ? user : null;
    }

    private Long parseLeadingId(String subject) {
        int idx = 0;
        while (idx < subject.length() && Character.isDigit(subject.charAt(idx))) {
            idx++;
        }
        if (idx == 0) {
            return null;
        }
        try {
            return Long.parseLong(subject.substring(0, idx));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isAuthorized(User user, String method, String path) {
        boolean isAdmin = user instanceof Admin;
        boolean isProf = user instanceof Professor;
        boolean isStudent = user instanceof Student;

        if (isAdmin) {
            return true;
        }

        // Admin-only routes
        if (path.equals("/api/users/all")
                || path.equals("/api/users/allProfessor")
                || path.startsWith("/api/users/activate/")
                || path.startsWith("/api/users/delete/professor/")
                || path.equals("/api/users/register/admin")) {
            return false;
        }

        // Professor-only (or Admin) routes
        if (path.equals("/api/users/allStudent")
                || path.equals("/api/users/register/student")
                || path.equals("/api/studentpws/all")
                || path.startsWith("/api/studentpws/delete/")) {
            return isProf;
        }

        if (path.matches("^/api/users/update/\\d+$")) {
            return isProf;
        }

        if (path.startsWith("/api/users/delete/student/")) {
            if (!isProf) return false;
            Long profId = parsePathIdAfterPrefix(path, "/api/users/delete/student/");
            return profId != null && profId == user.getId();
        }

        if (path.startsWith("/api/users/students/group/")) {
            if (!isProf) return false;
            Long groupId = parseTrailingId(path);
            return groupId != null && professorOwnsGroup(user.getId(), groupId);
        }

        if (path.startsWith("/api/users/students/")) {
            if (!isProf) return false;
            Long profId = parseTrailingId(path);
            return profId != null && profId == user.getId();
        }

        if (path.startsWith("/api/groups/professor/")) {
            if (!isProf) return false;
            Long profId = parseTrailingId(path);
            return profId != null && profId == user.getId();
        }

        if (path.startsWith("/api/groups/add/")) {
            if (!isProf) return false;
            Long profId = parseTrailingId(path);
            return profId != null && profId == user.getId();
        }

        if (path.startsWith("/api/groups/") || path.startsWith("/api/pws/") || path.startsWith("/api/teeth/")) {
            if (isMutatingMethod(method)) {
                return isProf;
            }
            if (path.startsWith("/api/groups/student/")) {
                Long studentId = parseTrailingId(path);
                if (isStudent) return studentId != null && studentId == user.getId();
                return isProf;
            }
            return isProf || isStudent;
        }

        if (path.startsWith("/api/users/update/professor/")) {
            Long id = parseTrailingId(path);
            return isProf && id != null && id == user.getId();
        }

        if (path.startsWith("/api/users/update/student/")) {
            Long id = parseTrailingId(path);
            if (isStudent) return id != null && id == user.getId();
            return isProf;
        }

        if (path.startsWith("/api/users/testpw/") || path.startsWith("/api/users/pw/")) {
            Long id = parseTrailingId(path);
            if (isStudent) return id != null && id == user.getId();
            return isProf && (id != null && (id == user.getId() || professorOwnsStudent(user.getId(), id)));
        }

        if (path.matches("^/api/users/\\d+$")) {
            Long id = parseTrailingId(path);
            if (isStudent) return id != null && id == user.getId();
            return isProf && (id != null && (id == user.getId() || professorOwnsStudent(user.getId(), id)));
        }

        if (path.startsWith("/api/studentpws/add/")) {
            Long studentId = parsePathIdAfterPrefix(path, "/api/studentpws/add/");
            if (isStudent) return studentId != null && studentId == user.getId();
            return isProf;
        }

        if (path.matches("^/api/studentpws/\\d+$")) {
            Long spwId = parseTrailingId(path);
            if (spwId == null) return false;
            if (isProf) return true;
            if (isStudent) {
                StudentPW spw = studentPWService.findById(spwId);
                return spw != null && spw.getStudent() != null && spw.getStudent().getId() == user.getId();
            }
        }

        return false;
    }

    private boolean professorOwnsGroup(long profId, long groupId) {
        return groupRepository.findById(groupId)
                .map(g -> g.getProfessor() != null && g.getProfessor().getId() == profId)
                .orElse(false);
    }

    private boolean professorOwnsStudent(long profId, long studentId) {
        return userRepository.findById(studentId)
                .filter(u -> u instanceof Student)
                .map(u -> ((Student) u).getGroup())
                .map(g -> g != null && g.getProfessor() != null && g.getProfessor().getId() == profId)
                .orElse(false);
    }

    private Long parseTrailingId(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash < 0 || lastSlash == path.length() - 1) return null;
        try {
            return Long.parseLong(path.substring(lastSlash + 1));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long parsePathIdAfterPrefix(String path, String prefix) {
        if (!path.startsWith(prefix)) return null;
        String rest = path.substring(prefix.length());
        int slash = rest.indexOf('/');
        String segment = slash >= 0 ? rest.substring(0, slash) : rest;
        try {
            return Long.parseLong(segment);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void writeError(HttpServletRequest request,
                            HttpServletResponse response,
                            int status,
                            String message) throws IOException {
        String origin = request.getHeader("Origin");
        if (origin != null && isAllowedOrigin(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
        }
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String escaped = message.replace("\"", "\\\"");
        response.getWriter().write("{\"message\":\"" + escaped + "\"}");
    }

    private boolean isAllowedOrigin(String origin) {
        return Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .anyMatch(allowed -> allowed.equals(origin));
    }
}
