package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.FriendRequestDto;
import com.kiemnv.MindGardAPI.dto.response.FriendUserDto;
import com.kiemnv.MindGardAPI.entity.FriendRequest;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.FriendRequestRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public long countFriends(Long userId) {
        return friendRequestRepository.countFriends(userId);
    }

    @Transactional(readOnly = true)
    public String getRelationshipStatus(Long viewerId, Long targetId) {
        if (viewerId == null || targetId == null) return "NONE";
        if (viewerId.equals(targetId)) return "SELF";

        if (friendRequestRepository.areFriends(viewerId, targetId)) return "ACCEPTED";

        List<FriendRequest> any = friendRequestRepository.findAnyBetween(viewerId, targetId);
        for (FriendRequest fr : any) {
            if (fr.getStatus() != FriendRequest.Status.PENDING) continue;
            // viewer -> target
            if (fr.getRequester().getId().equals(viewerId) && fr.getRecipient().getId().equals(targetId)) return "SENT";
            // target -> viewer
            if (fr.getRequester().getId().equals(targetId) && fr.getRecipient().getId().equals(viewerId)) return "RECEIVED";
        }
        return "NONE";
    }

    @Transactional(readOnly = true)
    public Long getPendingRequestIdBetween(Long a, Long b) {
        if (a == null || b == null || a.equals(b)) return null;
        List<FriendRequest> any = friendRequestRepository.findAnyBetween(a, b);
        for (FriendRequest fr : any) {
            if (fr.getStatus() == FriendRequest.Status.PENDING) return fr.getId();
        }
        return null;
    }

    @Transactional
    public FriendRequestDto sendRequest(User viewer, Long recipientId) {
        if (viewer == null || viewer.getId() == null) throw new RuntimeException("Unauthorized");
        if (recipientId == null) throw new IllegalArgumentException("recipientId required");
        if (viewer.getId().equals(recipientId)) throw new IllegalArgumentException("Cannot friend yourself");

        User recipient = userRepository.findById(recipientId).orElseThrow(() -> new RuntimeException("Recipient not found"));

        // already friends?
        if (friendRequestRepository.areFriends(viewer.getId(), recipientId)) {
            throw new IllegalStateException("Already friends");
        }

        // if there's pending in reverse, accept it
        List<FriendRequest> any = friendRequestRepository.findAnyBetween(viewer.getId(), recipientId);
        for (FriendRequest fr : any) {
            if (fr.getStatus() == FriendRequest.Status.PENDING) {
                if (fr.getRequester().getId().equals(recipientId)) {
                    fr.setStatus(FriendRequest.Status.ACCEPTED);
                    fr.setRespondedAt(LocalDateTime.now());
                    return toDto(friendRequestRepository.save(fr));
                }
                // already sent
                return toDto(fr);
            }
        }

        FriendRequest created = FriendRequest.builder()
                .requester(viewer)
                .recipient(recipient)
                .status(FriendRequest.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        return toDto(friendRequestRepository.save(created));
    }

    @Transactional
    public FriendRequestDto sendRequestByIdentifier(User viewer, String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("identifier required");
        }
        String q = identifier.trim();

        Optional<User> found;
        if (q.contains("@")) {
            found = userRepository.findByEmailIgnoreCase(q);
        } else {
            found = userRepository.findByUsernameIgnoreCase(q);
            if (found.isEmpty()) {
                // allow email without @ typo, try email exact too
                found = userRepository.findByEmailIgnoreCase(q);
            }
        }

        User recipient = found.orElseThrow(() -> new RuntimeException("User not found"));
        return sendRequest(viewer, recipient.getId());
    }

    @Transactional
    public FriendRequestDto accept(User viewer, Long requestId) {
        FriendRequest fr = friendRequestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Request not found"));
        if (!fr.getRecipient().getId().equals(viewer.getId())) throw new RuntimeException("Forbidden");
        if (fr.getStatus() != FriendRequest.Status.PENDING) return toDto(fr);
        fr.setStatus(FriendRequest.Status.ACCEPTED);
        fr.setRespondedAt(LocalDateTime.now());
        return toDto(friendRequestRepository.save(fr));
    }

    @Transactional
    public FriendRequestDto decline(User viewer, Long requestId) {
        FriendRequest fr = friendRequestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Request not found"));
        if (!fr.getRecipient().getId().equals(viewer.getId())) throw new RuntimeException("Forbidden");
        if (fr.getStatus() != FriendRequest.Status.PENDING) return toDto(fr);
        fr.setStatus(FriendRequest.Status.DECLINED);
        fr.setRespondedAt(LocalDateTime.now());
        return toDto(friendRequestRepository.save(fr));
    }

    @Transactional
    public FriendRequestDto cancel(User viewer, Long requestId) {
        FriendRequest fr = friendRequestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Request not found"));
        if (!fr.getRequester().getId().equals(viewer.getId())) throw new RuntimeException("Forbidden");
        if (fr.getStatus() != FriendRequest.Status.PENDING) return toDto(fr);
        fr.setStatus(FriendRequest.Status.CANCELED);
        fr.setRespondedAt(LocalDateTime.now());
        return toDto(friendRequestRepository.save(fr));
    }

    @Transactional
    public void unfriend(User viewer, Long otherUserId) {
        if (viewer.getId().equals(otherUserId)) return;
        List<FriendRequest> any = friendRequestRepository.findAnyBetween(viewer.getId(), otherUserId);
        for (FriendRequest fr : any) {
            if (fr.getStatus() == FriendRequest.Status.ACCEPTED) {
                friendRequestRepository.delete(fr);
                return;
            }
        }
        throw new RuntimeException("Not friends");
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> incoming(User viewer) {
        List<FriendRequest> list = friendRequestRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(viewer.getId(), FriendRequest.Status.PENDING);
        List<FriendRequestDto> out = new ArrayList<>();
        for (FriendRequest fr : list) out.add(toDto(fr));
        return out;
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> outgoing(User viewer) {
        List<FriendRequest> list = friendRequestRepository.findByRequesterIdAndStatusOrderByCreatedAtDesc(viewer.getId(), FriendRequest.Status.PENDING);
        List<FriendRequestDto> out = new ArrayList<>();
        for (FriendRequest fr : list) out.add(toDto(fr));
        return out;
    }

    @Transactional(readOnly = true)
    public List<FriendUserDto> friends(User viewer) {
        List<FriendRequest> accepted = friendRequestRepository.findAcceptedForUser(viewer.getId());
        List<FriendUserDto> out = new ArrayList<>();
        for (FriendRequest fr : accepted) {
            User other = fr.getRequester().getId().equals(viewer.getId()) ? fr.getRecipient() : fr.getRequester();
            out.add(toUserDto(other));
        }
        return out;
    }

    private FriendRequestDto toDto(FriendRequest fr) {
        return FriendRequestDto.builder()
                .id(fr.getId())
                .status(fr.getStatus().name())
                .createdAt(fr.getCreatedAt())
                .respondedAt(fr.getRespondedAt())
                .requester(toUserDto(fr.getRequester()))
                .recipient(toUserDto(fr.getRecipient()))
                .build();
    }

    private FriendUserDto toUserDto(User u) {
        if (u == null) return null;
        String displayName = (u.getFirstName() != null && u.getLastName() != null)
                ? (u.getFirstName() + " " + u.getLastName()).trim()
                : (u.getFirstName() != null ? u.getFirstName() : u.getUsername());
        return FriendUserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .displayName(displayName)
                .avatarUrl(u.getAvatarUrl())
                .level(u.getLevel())
                .build();
    }
}

