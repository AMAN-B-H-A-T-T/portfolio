import { portfolioData } from "@/data/portfolio";

export const getCommandResponse = (cmd: string): any => {
  const data = portfolioData;

  switch (cmd) {
    case "about":
      return {
        type: "text",
        content: data.about.content,
      };

    case "whoami":
      return {
        type: "text",
        content: data.philosophy.content,
      };

    case "uptime":
      return {
        type: "text",
        content: `[ TEMPORAL_LOG_EXTRACTED ]\nActive Session: ${
          data.uptime.session
        }\n-----------------------------------------\n${data.uptime.milestones
          .map((m) => `[-] ${m}`)
          .join(
            "\n"
          )}\n-----------------------------------------\nStatus: OPTIMIZED & READY_FOR_SCALE`,
      };

    case "experience":
      return {
        type: "component",
        content: "EXPERIENCE_LIST",
      };

    case "education":
      return {
        type: "component",
        content: "EDUCATION_LIST",
      };

    case "skills":
      const skillsContent = data.skills.categories
        .map((cat) => {
          const items = cat.items
            .map((skill) => {
              const width = 20;
              const filled = Math.floor((skill.level / 100) * width);
              const empty = width - filled;
              const bar = `[ ${"■".repeat(filled)}${".".repeat(empty)} ]`;
              return `${skill.name.padEnd(16)} ${bar} ${skill.level}%`;
            })
            .join("\n");
          return `[ ${cat.title} ]\n${items}`;
        })
        .join("\n\n");
      return {
        type: "text",
        content: skillsContent,
      };

    case "hire":
      return {
        type: "text",
        content: `${data.hire.message}\n\nInitiate secure contact protocol? [Y/n]: `,
      };

    case "contact":
      return {
        type: "text",
        content: `[ SELECT_COMMUNICATION_CHANNEL ]\n------------------------------------------------------------\n[ 01 ] EMAIL       - ${data.contact.email}\n[ 02 ] LINKEDIN    - Professional Network\n[ 03 ] GITHUB      - Source Code & Research\n\nChoose an option [1-3]: `,
      };

    case "github":
      return {
        type: "component",
        content: "GITHUB_PROFILE",
      };

    case "projects":
      const projectsContent = `[ DEPLOYED_PROTOTYPES ]\n------------------------------------------------------------\n${data.projects
        .map(
          (p) =>
            `ID: ${p.id} // ^${p.title}^ [ ${p.status} ]\n"${p.desc}"\nSTACK: ${p.stack}\nMETRIC: ${p.metrics}\nLINK: ${p.url}`
        )
        .join(
          "\n\n"
        )}\n------------------------------------------------------------`;
      return {
        type: "text",
        content: projectsContent,
      };

    default:
      return null;
  }
};
