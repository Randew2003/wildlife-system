package com.wildlife.backend.repository;

import com.wildlife.backend.entity.UserAccount;
import com.wildlife.backend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<UserAccount> findByRoleInOrderByFullNameAsc(Collection<UserRole> roles);

    List<UserAccount> findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole role);

    Optional<UserAccount> findByEmailIgnoreCaseAndRoleAndEnabledTrue(String email, UserRole role);

    boolean existsByRangerIdAndRoleAndEnabledTrue(String rangerId, UserRole role);
}
