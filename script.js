/* =========================
SCRIPT.JS
========================= */

const loadBtn =
  document.getElementById("loadBtn");

const totalContribs =
  document.getElementById("totalContribs");

const uniquePages =
  document.getElementById("uniquePages");

const latestEdit =
  document.getElementById("latestEdit");

const topNamespace =
  document.getElementById("topNamespace");

const editStreak =
  document.getElementById("editStreak");

const contribTable =
  document.getElementById("contribTable");

const chart =
  document.getElementById("chart");

const contributionCalendar =
  document.getElementById("contributionCalendar");

const momentumGraph =
  document.getElementById("momentumGraph");

/* LOAD BUTTON */

loadBtn.addEventListener(
  "click",
  loadContributions
);

/* MAIN */

async function loadContributions(){

  const wiki =
    document.getElementById("wikiSelect").value;

  const username =
    document.getElementById("username")
    .value
    .trim();

  if(!username){
    alert("Enter a username");
    return;
  }

  chart.innerHTML = "";
  contribTable.innerHTML = "";
  contributionCalendar.innerHTML = "";
  momentumGraph.innerHTML = "";

  const url =
    `https://${wiki}.wikipedia.org/w/api.php` +
    `?action=query` +
    `&list=usercontribs` +
    `&ucuser=${encodeURIComponent(username)}` +
    `&uclimit=500` +
    `&ucprop=title|timestamp|comment|sizediff|ids` +
    `&format=json` +
    `&origin=*`;

  try{

    const response =
      await fetch(url);

    const data =
      await response.json();

    const contributions =
      data.query.usercontribs;

    if(!contributions.length){
      alert("No contributions found");
      return;
    }

    /* ======================
       BASIC STATS
    ====================== */

    totalContribs.textContent =
      contributions.length;

    const unique =
      new Set(
        contributions.map(c=>c.title)
      );

    uniquePages.textContent =
      unique.size;

    latestEdit.textContent =
      new Date(
        contributions[0].timestamp
      ).toLocaleDateString();

    /* ======================
       EDIT STREAK
    ====================== */

    const uniqueDays = [
      ...new Set(
        contributions.map(c =>
          new Date(c.timestamp)
            .toISOString()
            .slice(0,10)
        )
      )
    ].sort((a,b)=>
      new Date(b)-new Date(a)
    );

    let streak = 1;

    for(let i=0;i<uniqueDays.length-1;i++){

      const current =
        new Date(uniqueDays[i]);

      const next =
        new Date(uniqueDays[i+1]);

      const diff =
        (current-next)/
        (1000*60*60*24);

      if(diff===1){
        streak++;
      }else{
        break;
      }
    }

    editStreak.textContent =
      `${streak} day${streak!==1?'s':''}`;

    /* ======================
       NAMESPACE ANALYSIS
    ====================== */

    const namespaceMap = {};

    contributions.forEach(c=>{

      let ns = "Article";

      if(c.title.includes(":")){
        ns = c.title.split(":")[0];
      }

      namespaceMap[ns] =
        (namespaceMap[ns]||0)+1;

    });

    const topNS =
      Object.entries(namespaceMap)
      .sort((a,b)=>b[1]-a[1])[0];

    topNamespace.textContent =
      topNS[0];

    /* ======================
       DAILY EDITS
    ====================== */

    const dailyEdits = {};

    contributions.forEach(c=>{

      const day =
        new Date(c.timestamp)
          .toISOString()
          .slice(0,10);

      dailyEdits[day] =
        (dailyEdits[day]||0)+1;

    });

    /* ======================
       BAR CHART
    ====================== */

    const entries =
      Object.entries(dailyEdits)
      .slice(0,30)
      .reverse();

    const max =
      Math.max(
        ...entries.map(e=>e[1])
      );

    entries.forEach(([date,count])=>{

      const bar =
        document.createElement("div");

      bar.className = "bar";

      bar.style.height =
        `${(count/max)*100}%`;

      bar.dataset.count =
        `${date}: ${count} edits`;

      chart.appendChild(bar);

    });

    /* ======================
       CONTRIBUTION CALENDAR
    ====================== */

    const today = new Date();

    for(let i=364;i>=0;i--){

      const d = new Date();

      d.setDate(today.getDate()-i);

      const key =
        d.toISOString().slice(0,10);

      const count =
        dailyEdits[key]||0;

      let level = 0;

      if(count>=1) level=1;
      if(count>=3) level=2;
      if(count>=6) level=3;
      if(count>=10) level=4;

      const cell =
        document.createElement("div");

      cell.className =
        `day-cell level-${level}`;

      cell.title =
        `${key} — ${count} edits`;

      contributionCalendar
        .appendChild(cell);

    }

    /* ======================
       MOMENTUM GRAPH
    ====================== */

    const sortedDays =
      Object.entries(dailyEdits)
      .sort((a,b)=>
        new Date(a[0])-
        new Date(b[0])
      );

    const width = 900;
    const height = 220;
    const padding = 30;

    const maxEdits =
      Math.max(
        ...sortedDays.map(d=>d[1]),
        1
      );

    const points =
      sortedDays.map(([date,count],i)=>{

        const x =
          padding +
          (i/(sortedDays.length-1))*
          (width-padding*2);

        const y =
          height-padding-
          ((count/maxEdits)*
          (height-padding*2));

        return {x,y,count,date};

      });

    let linePath = "";
    let areaPath = "";

    points.forEach((p,i)=>{

      if(i===0){

        linePath +=
          `M ${p.x} ${p.y}`;

        areaPath +=
          `M ${p.x} ${height-padding}
           L ${p.x} ${p.y}`;

      }else{

        linePath +=
          ` L ${p.x} ${p.y}`;

        areaPath +=
          ` L ${p.x} ${p.y}`;

      }

    });

    if(points.length){

      const last =
        points[points.length-1];

      areaPath +=
        ` L ${last.x} ${height-padding} Z`;

    }

    const area =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

    area.setAttribute("d",areaPath);
    area.setAttribute("class","graph-area");

    momentumGraph.appendChild(area);

    const path =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

    path.setAttribute("d",linePath);
    path.setAttribute("class","graph-line");

    momentumGraph.appendChild(path);

    points.forEach(p=>{

      const circle =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );

      circle.setAttribute("cx",p.x);
      circle.setAttribute("cy",p.y);
      circle.setAttribute("r",4);
      circle.setAttribute("class","graph-point");

      const title =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "title"
        );

      title.textContent =
        `${p.date}: ${p.count} edits`;

      circle.appendChild(title);

      momentumGraph.appendChild(circle);

    });

    /* ======================
       CONTRIBUTION TABLE
    ====================== */

    contributions.forEach(c=>{

      const row =
        document.createElement("tr");

      const diff =
        c.sizediff || 0;

      row.innerHTML = `
        <td>${c.title}</td>
        <td>
          ${new Date(c.timestamp)
            .toLocaleString()}
        </td>
        <td>${c.comment || "-"}</td>
        <td class="${
          diff >= 0
          ? 'diff-positive'
          : 'diff-negative'
        }">
          ${diff >= 0 ? '+' : ''}${diff}
        </td>
      `;

      contribTable.appendChild(row);

    });

  }catch(err){

    console.error(err);

    alert(
      "Failed to load contributions"
    );

  }

}

/* INITIAL LOAD */

loadContributions();
