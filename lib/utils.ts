// Generate UEC unique ID: UEC-STU-0001, UEC-TEA-0001, etc.
export function generateUECId(role: string, count: number): string {
  const prefix = role === "STUDENT" ? "STU" : role === "TEACHER" ? "TEA" : "ADM"
  const number = String(count + 1).padStart(4, "0")
  return `UEC-${prefix}-${number}`
}

// Generate avatar from name (initials)
export function generateAvatar(name: string): string {
  const names = name.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Get avatar color based on unique ID
export function getAvatarColor(uniqueId: string): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ]
  const hash = uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

